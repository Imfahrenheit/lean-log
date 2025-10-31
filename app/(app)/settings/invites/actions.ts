"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";

export type InvitePublic = {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

/**
 * Generate a secure random invite code
 */
function generateInviteCode(): string {
  // Generate a URL-safe random string (8-10 characters)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function listInvites(): Promise<InvitePublic[]> {
  // Check admin status - only admins can list invites
  await checkAdmin();

  const supabase = await createSupabaseServerClient();
  
  // Admins can see all invites (not just their own)
  const { data, error } = await supabase
    .from("invites")
    .select("id, code, created_by, used_by, used_at, expires_at, revoked_at, created_at")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return (data ?? []) as InvitePublic[];
}

export async function generateInvite(expiresInDays?: number): Promise<InvitePublic> {
  // Check admin status - only admins can generate invites
  await checkAdmin();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate a unique code (retry if collision)
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateInviteCode();
    attempts++;

    // Check if code already exists
    const { data: existing } = await supabase
      .from("invites")
      .select("id")
      .eq("code", code)
      .single();

    if (!existing) {
      break; // Code is unique
    }

    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique invite code after multiple attempts");
    }
  } while (attempts < maxAttempts);

  // Calculate expiration if provided
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("invites")
    .insert({
      code,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, code, created_by, used_by, used_at, expires_at, revoked_at, created_at")
    .single();

  if (error) throw error;

  revalidatePath("/(app)/settings/invites");
  return data as InvitePublic;
}

export async function revokeInvite(id: string): Promise<void> {
  // Check admin status - only admins can revoke invites
  await checkAdmin();

  if (!id) throw new Error("Invite id is required");

  const supabase = await createSupabaseServerClient();

  // Admins can revoke any invite (not just their own)
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("used_at", null); // Only revoke unused invites

  if (error) throw error;
  revalidatePath("/(app)/settings/invites");
}

