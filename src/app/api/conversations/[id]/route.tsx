import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getSession } from "@/lib/guards";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  if (session.user.status !== "approved") return NextResponse.json({ error: "Akses belum disetujui." }, { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });

  // Hanya bisa menghapus percakapan milik sendiri
  const deleted = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, session.user.id)))
    .returning({ id: conversations.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Percakapan tidak ditemukan." }, { status: 404 });

  return NextResponse.json({ ok: true });
}