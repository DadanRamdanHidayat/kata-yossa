import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, loginCodes, user } from "@/db/schema";
import { getSession } from "@/lib/guards";
import { CODE_TTL_MINUTES, hashLoginCode, isAdminEmail, newLoginCode } from "@/lib/login-code";

const Body = z.object({ email: z.string().trim().toLowerCase().email() });

// Admin membuat kode masuk satu kali untuk pengguna non-admin.
// Email baru otomatis dibuatkan akun berstatus disetujui; akun "menunggu" otomatis disetujui.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  const { email } = parsed.data;

  if (isAdminEmail(email)) {
    return NextResponse.json({ error: "Akun admin masuk dengan kode yang dikirim ke emailnya." }, { status: 400 });
  }

  let [target] = await db.select({ id: user.id, role: user.role, status: user.status }).from(user).where(eq(user.email, email)).limit(1);

  if (target?.role === "admin") {
    return NextResponse.json({ error: "Akun admin masuk dengan kode yang dikirim ke emailnya." }, { status: 400 });
  }
  if (target?.status === "rejected") {
    return NextResponse.json({ error: "Akun ini ditolak. Setujui dulu di daftar pengguna." }, { status: 400 });
  }

  if (!target) {
    const id = crypto.randomUUID();
    await db.insert(user).values({ id, email, name: "", emailVerified: true, role: "user", status: "approved" });
    target = { id, role: "user", status: "approved" };
    await db.insert(auditLogs).values({ adminId: session.user.id, action: "set_status:approved", targetUserId: id });
  } else if (target.status !== "approved") {
    await db.update(user).set({ status: "approved", updatedAt: new Date() }).where(eq(user.id, target.id));
    await db.insert(auditLogs).values({ adminId: session.user.id, action: "set_status:approved", targetUserId: target.id });
  }

  const code = newLoginCode();
  await db.delete(loginCodes).where(eq(loginCodes.userId, target.id)); // satu kode aktif per pengguna
  await db.insert(loginCodes).values({
    userId: target.id,
    codeHash: hashLoginCode(target.id, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
    createdBy: session.user.id,
  });
  await db.insert(auditLogs).values({ adminId: session.user.id, action: "create_otp", targetUserId: target.id });

  // Kode hanya ditampilkan sekali di sini; di database hanya tersimpan hash-nya.
  return NextResponse.json({ ok: true, email, code, expiresInMinutes: CODE_TTL_MINUTES });
}