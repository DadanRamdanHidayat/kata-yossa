import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLogs, settings } from "@/db/schema";
import { providerStatus } from "@/lib/ai";
import { getSession } from "@/lib/guards";

const Body = z.object({
  dailyMessageLimit: z.number().int().min(1).max(100_000),
  tokenLimit: z.number().int().min(1_000).max(1_000_000_000_000),
  aiProvider: z.string(),
  aiFallback: z.string(),
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return fail("Tidak diizinkan.", 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Data tidak valid.");
  const { dailyMessageLimit, tokenLimit, aiProvider, aiFallback } = parsed.data;

  const status = providerStatus();
  const ready = (n: string) => status.find((p) => p.name === n)?.hasKey === true;
  if (!ready(aiProvider)) return fail(`API key untuk "${aiProvider}" belum diisi di environment.`);
  if (aiFallback) {
    if (!ready(aiFallback)) return fail(`API key untuk "${aiFallback}" belum diisi di environment.`);
    if (aiFallback === aiProvider) return fail("Penyedia cadangan tidak boleh sama dengan penyedia utama.");
  }

  const by = session.user.id;
  await db
    .insert(settings)
    .values([
      { key: "daily_message_limit", value: String(dailyMessageLimit), updatedBy: by },
      { key: "token_limit", value: String(tokenLimit), updatedBy: by },
      { key: "ai_provider", value: aiProvider, updatedBy: by },
      { key: "ai_fallback_provider", value: aiFallback, updatedBy: by },
    ])
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: sql`excluded.value`, updatedAt: new Date(), updatedBy: by },
    });

  await db.insert(auditLogs).values({ adminId: by, action: "update_settings" });
  return NextResponse.json({ ok: true });
}