import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { conversations, messages, usageLogs } from "@/db/schema";
import { askAI } from "@/lib/ai";
import { getSession } from "@/lib/guards";
import { getSettings } from "@/lib/settings";

const Body = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().nullish(),
});

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  // 1. Autentikasi + status persetujuan (dicek di server)
  const session = await getSession();
  if (!session) return fail("Silakan masuk terlebih dahulu.", 401);
  if (session.user.status !== "approved") return fail("Akses Anda belum disetujui.", 403);
  const userId = session.user.id;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Pesan tidak valid.", 400);
  const { message } = parsed.data;

  // 2. Batas pesan harian
  const { dailyMessageLimit: limit } = await getSettings();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [{ n }] = await db
    .select({ n: count() })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(eq(conversations.userId, userId), eq(messages.role, "user"), gte(messages.createdAt, startOfDay)));
  if (n >= limit) return fail("Batas pesan harian tercapai. Coba lagi besok.", 429);

  // 3. Percakapan harus milik pengguna ini
  let conversationId = parsed.data.conversationId ?? null;
  if (conversationId) {
    const [owned] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
    if (!owned) return fail("Percakapan tidak ditemukan.", 404);
  } else {
    const [created] = await db
      .insert(conversations)
      .values({ userId, title: message.slice(0, 50) })
      .returning({ id: conversations.id });
    conversationId = created.id;
  }

  await db.insert(messages).values({ conversationId, role: "user", content: message });

  // 4. Ambil 20 pesan terakhir sebagai konteks
  const recent = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(20);
  const history = recent.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // 5. Panggil penyedia AI (hanya dari server)
  let result;
  try {
    result = await askAI(history);
  } catch (e) {
    console.error("AI error:", e);
    return fail("Layanan AI sedang bermasalah. Coba lagi sebentar lagi.", 502);
  }

  // 6. Simpan jawaban + catat pemakaian
  await db.insert(messages).values({ conversationId, role: "assistant", content: result.text });
  await db.insert(usageLogs).values({
    userId,
    conversationId,
    model: `${result.provider}:${result.model}`,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.costUsd,
  });
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

  return NextResponse.json({ conversationId, reply: result.text });
}