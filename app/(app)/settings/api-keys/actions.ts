"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateRawKey, hashKey } from "@/lib/mcp/api-keys";

export type ApiKeyPublic = {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export async function listApiKeys(): Promise<ApiKeyPublic[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, created_at, last_used_at, revoked_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiKeyPublic[];
}

export async function createApiKey(name: string): Promise<{ key: string; record: ApiKeyPublic }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = name?.trim();
  if (!trimmed) throw new Error("Name is required");

  const rawKey = generateRawKey();
  const hashed = hashKey(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: trimmed,
      hashed_key: hashed,
    })
    .select("id, name, created_at, last_used_at, revoked_at")
    .single();

  if (error) {
    // Surface unique name violation clearly
    if ((error as { code?: string }).code === "23505") {
      throw new Error("A non-revoked key with this name already exists");
    }
    throw error;
  }

  revalidatePath("/(app)/settings/api-keys");
  return { key: rawKey, record: data as ApiKeyPublic };
}

export async function revokeApiKey(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!id) throw new Error("Key id is required");

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/(app)/settings/api-keys");
}


