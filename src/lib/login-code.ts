import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MINUTES = 15;
export const CODE_MAX_ATTEMPTS = 5;

export function newLoginCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// HMAC dengan BETTER_AUTH_SECRET, jadi hash di database tidak bisa ditebak tanpa secret itu.
export function hashLoginCode(userId: string, code: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "").update(`${userId}:${code}`).digest("hex");
}

export function sameHash(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}