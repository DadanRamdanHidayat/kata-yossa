import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { getSession } from "@/lib/guards";

const Body = z.object({
  userId: z.string().min(1),
  status: z.enum(["approved", "rejected", "pending"]),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  const { userId, status } = parsed.data;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Tidak bisa mengubah status akun sendiri." }, { status: 400 });
  }

  const updated = await db
    .update(user)
    .set({ status, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning({ id: user.id });
  if (updated.length === 0) return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });

  await db.insert(auditLogs).values({
    adminId: session.user.id,
    action: `set_status:${status}`,
    targetUserId: userId,
  });

  return NextResponse.json({ ok: true });
}
