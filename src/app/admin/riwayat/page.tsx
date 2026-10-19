import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { ChevronRight, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { db } from "@/db";
import { conversations, user } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";

const TZ = "Asia/Jakarta";

export default async function AdminRiwayatPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { user: me } = await requireAdmin();
  const { q } = await searchParams;
  const term = q?.trim();

  const rows = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
      email: user.email,
      total: sql<number>`(select count(*)::int from messages m where m.conversation_id = ${conversations.id})`,
      preview: sql<string | null>`(select content from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
    })
    .from(conversations)
    .innerJoin(user, eq(conversations.userId, user.id))
    .where(term ? or(ilike(conversations.title, `%${term}%`), ilike(user.email, `%${term}%`)) : undefined)
    .orderBy(desc(conversations.updatedAt))
    .limit(100);

  return (
    <AdminShell active="riwayat" email={me.email}>
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-navy">Riwayat Chat Pengguna</h2>
        <p className="text-xs text-slate-500">Setiap kali admin membuka percakapan, tindakannya tercatat di Log Aktivitas</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <form className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={term ?? ""}
            placeholder="Cari email pengguna atau judul percakapan..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-600"
          />
        </form>

        {rows.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs">{term ? "Tidak ada percakapan yang cocok." : "Belum ada percakapan."}</p>
          </div>
        )}

        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/admin/riwayat/${r.id}`}
            className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
          >
            <div className="min-w-0 pr-3">
              <p className="truncate text-xs font-semibold text-navy group-hover:text-blue-600">{r.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{r.email} • {r.total} pesan</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{(r.preview ?? "").slice(0, 120)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-right text-[10px] text-slate-400">
                {r.updatedAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TZ })}
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
            </div>
          </Link>
        ))}
        {rows.length === 100 && <p className="text-center text-xs text-slate-400">Menampilkan 100 percakapan terbaru. Gunakan pencarian untuk mempersempit.</p>}
      </div>
    </AdminShell>
  );
}