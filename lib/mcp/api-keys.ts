import { randomBytes, scryptSync, timingSafeEqual } from "crypto";


const SCRYPT_COST = 16384; // aka N
const SCRYPT_BLOCK_SIZE = 8; // aka r
const SCRYPT_PARALLELIZATION = 1; // aka p
const DERIVED_KEY_LENGTH = 64;

export function generateRawKey(): string {
  // 32 bytes → 43-44 chars base64url; prefix for UX clarity
  const raw = randomBytes(32).toString("base64url");
  return `llk_${raw}`; // lean-log key
}

export function hashKey(rawKey: string): string {
  const [salt, hash] = scryptHash(rawKey);
  return `scrypt$${salt}$${hash}`;
}

export function verifyKey(rawKey: string, stored: string): boolean {
  if (!stored.startsWith("scrypt$")) return false;
  const [, salt, expect] = stored.split("$");
  const actual = scryptDerive(rawKey, salt);
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expect, "hex"));
}

function scryptHash(input: string): [string, string] {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptDerive(input, salt);
  return [salt, hash];
}

function scryptDerive(input: string, salt: string): string {
  const out = scryptSync(input, Buffer.from(salt, "hex"), DERIVED_KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
    // Rough memory usage: ~128 * cost * blockSize bytes
    maxmem: 128 * SCRYPT_COST * SCRYPT_BLOCK_SIZE * 2,
  });
  return out.toString("hex");
}


