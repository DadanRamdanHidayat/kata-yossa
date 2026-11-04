import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trustedDevices, user } from "@/db/schema";

export const DEVICE_COOKIE = "ky_device";

export function newDeviceToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Masa berlaku cookie dibuat panjang; yang menentukan sah tidaknya adalah tanggal langganan di database,
// jadi memperpanjang langganan otomatis memperpanjang perangkat yang sudah dikenali.
export function deviceCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  };
}

export function isActive(until: Date | null | undefined) {
  return !!until && until.getTime() > Date.now();
}

// Mengembalikan pengguna pemilik perangkat hanya jika: disetujui, bukan admin, dan langganannya masih berlaku.
export async function findTrustedUser(token: string) {
  const [row] = await db
    .select({
      deviceId: trustedDevices.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      until: user.subscriptionUntil,
    })
    .from(trustedDevices)
    .innerJoin(user, eq(trustedDevices.userId, user.id))
    .where(eq(trustedDevices.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;
  if (row.role === "admin" || row.status !== "approved" || !isActive(row.until)) return null;
  return row;
}
