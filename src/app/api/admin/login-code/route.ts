import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/guards";

const Body = z.object({ email: z.string().trim().toLowerCase().email() });

// Admin membuat kode masuk untuk satu email, lalu mengirimnya sendiri (misalnya lewat WhatsApp).
// Kode ini sekaligus berarti admin menyetujui akses email tersebut.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  const { email } = parsed.data;

  // Pastikan akunnya ada dan berstatus disetujui
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  let targetId: string;
  if (existing) {
    targetId = existing.id;
    await db.update(user).set({ status: "approved", updatedAt: new Date() }).where(eq(user.id, targetId));
  } else {
    targetId = crypto.randomUUID();
    await db.insert(user).values({ id: targetId, email, status: "approved", role: "user" });
  }

  const otp = await auth.api.createVerificationOTP({ body: { email, type: "sign-in" } });

  await db.insert(auditLogs).values({ adminId: session.user.id, action: "create_login_code", targetUserId: targetId });

  return NextResponse.json({ email, otp });
}
