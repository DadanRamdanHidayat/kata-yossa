import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, trustedDevices, user } from "@/db/schema";
import { getSession } from "@/lib/guards";

const Body = z.object({
  userId: z.string().min(1),
  plan: z.enum(["none", "1d", "1w", "1m", "3m", "1y"]),
});

function endDate(plan: "1d" | "1w" | "1m" | "3m" | "1y") {
  const d = new Date();
  if (plan === "1d") d.setDate(d.getDate() + 1);
  if (plan === "1w") d.setDate(d.getDate() + 7);
  if (plan === "1m") d.setMonth(d.getMonth() + 1);
  if (plan === "3m") d.setMonth(d.getMonth() + 3);
  if (plan === "1y") d.setFullYear(d.getFullYear() + 1);
  return d;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  const { userId, plan } = parsed.data;

  const [target] = await db.select({ role: user.role, status: user.status }).from(user).where(eq(user.id, userId)).limit(1);
  if (!target) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  if (target.role === "admin") return NextResponse.json({ error: "Akun admin tidak memakai langganan." }, { status: 400 });
  if (plan !== "none" && target.status !== "approved") {
    return NextResponse.json({ error: "Setujui akses pengguna terlebih dahulu." }, { status: 400 });
  }

  // Dihitung dari sekarang (menggantikan langganan sebelumnya, bukan menambah).
  const until = plan === "none" ? null : endDate(plan);
  await db.update(user).set({ subscriptionUntil: until, updatedAt: new Date() }).where(eq(user.id, userId));
  if (plan === "none") await db.delete(trustedDevices).where(eq(trustedDevices.userId, userId));

  await db.insert(auditLogs).values({ adminId: session.user.id, action: `set_subscription:${plan}`, targetUserId: userId });

  return NextResponse.json({ ok: true, until: until?.toISOString() ?? null });
}
