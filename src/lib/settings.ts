import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type AppSettings = {
  dailyMessageLimit: number;
  tokenLimit: number;
  aiProvider: string;
  aiFallback: string;
};

// Nilai dari Admin > Pengaturan (database) diutamakan; kalau belum ada, pakai .env.
export async function getSettings(): Promise<AppSettings> {
  let map = new Map<string, string>();
  try {
    const rows = await db.select().from(settings);
    map = new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    // Tabel belum dibuat (belum db:push): pakai .env saja
  }
  return {
    dailyMessageLimit: Number(map.get("daily_message_limit") ?? process.env.DAILY_MESSAGE_LIMIT ?? 30),
    tokenLimit: Number(map.get("token_limit") ?? process.env.TOKEN_LIMIT ?? 1_000_000),
    aiProvider: map.get("ai_provider") || process.env.AI_PROVIDER || "gemini",
    aiFallback: map.get("ai_fallback_provider") ?? process.env.AI_FALLBACK_PROVIDER ?? "",
  };
}