import { desc, eq, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/Sidebar";
import HistoryList from "@/components/HistoryList";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { requireApproved } from "@/lib/guards";

const TZ = "Asia/Jakarta";

export default async function RiwayatPage() {
  const { user } = await requireApproved();

  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
      preview: sql<string | null>`(select content from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
    })
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(100);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    preview: (r.preview ?? "").slice(0, 120),
    date: r.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }),
    time: r.updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }),
  }));

  return (
    <AppShell
      active="riwayat"
      isAdmin={user.role === "admin"}
      email={user.email}
      title="Riwayat Chat"
      subtitle="Daftar arsip konsultasi dan sesi strategi bisnis Anda"
      action={
        <Link href="/chat" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5" />
          Chat Baru
        </Link>
      }
    >
      <HistoryList items={items} />
    </AppShell>
  );
}