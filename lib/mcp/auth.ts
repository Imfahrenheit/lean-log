import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { timingSafeEqual, scryptSync } from "crypto";
import type { Database } from "@/lib/database.types";

export type AuthContext = {
  userId: string;
  keyId: string;
};

export async function authenticateMcpRequest(request: Request): Promise<AuthContext> {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    throw new Error("Missing Authorization header");
  }
  const token = header.slice("bearer ".length).trim();
  if (!token) throw new Error("Invalid Authorization header");

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, hashed_key, revoked_at")
    .is("revoked_at", null);
  if (error) throw error;

  if (!data || data.length === 0) throw new Error("Unauthorized");

  for (const row of data as Database["public"]["Tables"]["api_keys"]["Row"][]) {
    const stored = row.hashed_key;
    if (stored && verifyScrypt(token, stored)) {
      void supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", row.id);
      return { userId: row.user_id, keyId: row.id };
    }
  }
  throw new Error("Unauthorized");
}

function verifyScrypt(rawKey: string, stored: string): boolean {
  if (!stored.startsWith("scrypt$")) return false;
  const [, salt, expect] = stored.split("$");
  const derived = scryptDerive(rawKey, salt);
  return timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expect, "hex"));
}

const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const DERIVED_KEY_LENGTH = 64;

function scryptDerive(input: string, salt: string): string {
  const out = scryptSync(input, Buffer.from(salt, "hex"), DERIVED_KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
    maxmem: 128 * SCRYPT_COST * SCRYPT_BLOCK_SIZE * 2,
  });
  return out.toString("hex");
}


