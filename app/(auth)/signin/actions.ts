"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Check if a user with the given email already exists
 * Uses service client to query auth.users directly
 */
export async function checkUserExists(email: string): Promise<boolean> {
  if (!email || email.trim().length === 0) {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const supabase = createSupabaseServiceClient();
  
  try {
    // Try getUserByEmail first (more efficient if available)
    // @ts-expect-error - getUserByEmail may not be in types but exists in newer Supabase versions
    if (supabase.auth.admin.getUserByEmail) {
      const { data, error } = await supabase.auth.admin.getUserByEmail(trimmedEmail);
      
      if (error) {
        // If user not found, error code is usually "user_not_found" or 404
        if (error.message?.includes("not found") || error.status === 404) {
          return false;
        }
        console.error("Error checking user existence:", error);
        // Fail closed for security - if we can't check, assume user doesn't exist
        return false;
      }

      return !!data?.user;
    }

    // Fallback to listUsers with pagination handling
    let page = 1;
    const perPage = 1000; // Max per page
    
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (error) {
        console.error("Error checking user existence:", error);
        // Fail closed for security
        return false;
      }

      if (!data?.users || data.users.length === 0) {
        // No more users to check
        return false;
      }

      // Check if email exists in this page
      const found = data.users.some((user) => user.email?.toLowerCase() === trimmedEmail);
      if (found) {
        return true;
      }

      // If we got fewer users than perPage, we've reached the end
      if (data.users.length < perPage) {
        return false;
      }

      page++;
    }
  } catch (err) {
    console.error("Exception checking user existence:", err);
    // Fail closed for security
    return false;
  }
}

/**
 * Validate that an invite exists for the given email, is unused, not revoked, and not expired
 * Returns true if valid, false otherwise
 * Uses service client to bypass RLS for anonymous validation
 */
export async function validateInviteEmail(email: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Use service client to bypass RLS for validation
  // This allows anonymous users to validate invites
  const supabase = createSupabaseServiceClient();
  
  // Use eq instead of ilike since emails are stored in lowercase
  // Service client bypasses RLS, so we need to check validation conditions ourselves
  const { data, error } = await supabase
    .from("invites")
    .select("id, email, used_at, revoked_at, expires_at")
    .eq("email", trimmedEmail)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "No invite found for this email address" };
  }

  // Check validation conditions (since service client bypasses RLS)
  if (data.used_at) {
    return { valid: false, error: "This invite has already been used" };
  }

  if (data.revoked_at) {
    return { valid: false, error: "This invite has been revoked" };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "This invite has expired" };
  }

  return { valid: true };
}

