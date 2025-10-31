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
 * Validate that an invite code exists, is unused, not revoked, and not expired
 * Returns true if valid, false otherwise
 * Uses service client to bypass RLS for anonymous validation
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Invite code is required" };
  }

  // Use service client to bypass RLS for validation
  // This allows anonymous users to validate invite codes
  const supabase = createSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("invites")
    .select("id, code, used_at, revoked_at, expires_at")
    .eq("code", code.trim())
    .single();

  if (error || !data) {
    return { valid: false, error: "Invalid invite code" };
  }

  if (data.used_at) {
    return { valid: false, error: "This invite code has already been used" };
  }

  if (data.revoked_at) {
    return { valid: false, error: "This invite code has been revoked" };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, error: "This invite code has expired" };
  }

  return { valid: true };
}

