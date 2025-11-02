"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { checkAdmin } from "@/lib/auth/admin";

export type InvitePublic = {
  id: string;
  email: string;
  created_by: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export async function listInvites(): Promise<InvitePublic[]> {
  // Check admin status - only admins can list invites
  await checkAdmin();

  const supabase = await createSupabaseServerClient();
  
  // Admins can see all invites (not just their own)
  const { data, error } = await supabase
    .from("invites")
    .select("id, email, created_by, used_by, used_at, expires_at, revoked_at, created_at")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return (data ?? []) as InvitePublic[];
}

export async function generateInvite(email: string, expiresInDays?: number): Promise<InvitePublic> {
  // Check admin status - only admins can generate invites
  await checkAdmin();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate email
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Invalid email address");
  }

  // Check if user already exists (using service client for admin access)
  const serviceClient = createSupabaseServiceClient();
  const { data: existingUser } = await serviceClient.auth.admin.listUsers();
  if (existingUser?.users.some((u) => u.email?.toLowerCase() === trimmedEmail)) {
    throw new Error("A user with this email already exists");
  }

  // Check if invite already exists for this email (active one)
  const { data: existingInvite } = await supabase
    .from("invites")
    .select("id")
    .eq("email", trimmedEmail)
    .is("used_at", null)
    .is("revoked_at", null)
    .maybeSingle();

  if (existingInvite) {
    throw new Error("An active invite already exists for this email");
  }

  // Calculate expiration if provided
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("invites")
    .insert({
      email: trimmedEmail,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select("id, email, created_by, used_by, used_at, expires_at, revoked_at, created_at")
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      throw new Error("An invite for this email already exists");
    }
    throw error;
  }

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

