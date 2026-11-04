import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trustedDevices, user } from "@/db/schema";
import { DEVICE_COOKIE, deviceCookieOptions, hashToken, isActive, newDeviceToken } from "@/lib/device";
import { getSession } from "@/lib/guards";

// Menandai browser ini sebagai perangkat tepercaya (hanya jika pengguna berlangganan aktif).
// Dipanggil setelah OTP berhasil, dan sebelum "Keluar" untuk pengguna yang langganannya baru diberikan.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const [u] = await db
    .select({ role: user.role, status: user.status, until: user.subscriptionUntil })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  if (!u || u.role === "admin" || u.status !== "approved" || !isActive(u.until)) {
    return NextResponse.json({ ok: true, trusted: false });
  }

  const jar = await cookies();
  const existing = jar.get(DEVICE_COOKIE)?.value;
  if (existing) {
    const same = await db
      .update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(and(eq(trustedDevices.tokenHash, hashToken(existing)), eq(trustedDevices.userId, session.user.id)))
      .returning({ id: trustedDevices.id });
    if (same.length) {
      jar.set(DEVICE_COOKIE, existing, deviceCookieOptions());
      return NextResponse.json({ ok: true, trusted: true });
    }
    // Cookie lama milik akun lain di browser yang sama: hapus, lalu buat yang baru untuk akun ini.
    await db.delete(trustedDevices).where(eq(trustedDevices.tokenHash, hashToken(existing)));
  }

  const token = newDeviceToken();
  await db.insert(trustedDevices).values({
    userId: session.user.id,
    tokenHash: hashToken(token),
    userAgent: (await headers()).get("user-agent")?.slice(0, 200) ?? null,
  });
  jar.set(DEVICE_COOKIE, token, deviceCookieOptions());
  return NextResponse.json({ ok: true, trusted: true });
}

// Menghapus akses perangkat ini (tidak perlu sesi; cookie perangkat itulah buktinya).
export async function DELETE() {
  const jar = await cookies();
  const token = jar.get(DEVICE_COOKIE)?.value;
  if (token) await db.delete(trustedDevices).where(eq(trustedDevices.tokenHash, hashToken(token)));
  jar.delete(DEVICE_COOKIE);
  return NextResponse.json({ ok: true });
}