"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Check if a user with the given email already exists
 * Uses service client to query auth.users directly
 */
export async function checkUserExists(email: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error checking user existence:", error);
    // Fail open for existing users - if we can't check, allow them through
    // This ensures backwards compatibility
    return true;
  }

  return data.users.some((user) => user.email?.toLowerCase() === email.toLowerCase());
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

