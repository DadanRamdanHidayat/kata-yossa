"use client";

import { ChevronRight, MessageSquare, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: string; title: string; preview: string; date: string; time: string };

export default function HistoryList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const term = q.toLowerCase();
  const rows = items.filter((i) => i.title.toLowerCase().includes(term) || i.preview.toLowerCase().includes(term));

  async function remove(id: string) {
    if (!confirm("Hapus sesi percakapan ini dari riwayat?")) return;
    setBusy(id);
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) alert("Gagal menghapus percakapan.");
    router.refresh();
  }

  return (
    <div>
      <div className="border-b border-slate-200 bg-white p-4">
        <div className="relative mx-auto max-w-2xl">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari topik atau riwayat percakapan..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-blue-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-3 p-4 md:p-6">
        {rows.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-xs">{items.length === 0 ? "Belum ada percakapan." : "Tidak ada riwayat percakapan yang cocok."}</p>
          </div>
        )}
        {rows.map((i) => (
          <div
            key={i.id}
            onClick={() => router.push(`/chat?c=${i.id}`)}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
          >
            <div className="flex min-w-0 items-start gap-3 pr-2">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <MessageSquare className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h4 className="truncate text-xs font-semibold text-navy transition group-hover:text-blue-600">{i.title}</h4>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{i.preview}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right text-[10px] text-slate-400">
                <div>{i.date}</div>
                <div>{i.time}</div>
              </div>
              <button
                disabled={busy === i.id}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i.id);
                }}
                title="Hapus riwayat"
                className="rounded p-1 text-slate-300 transition hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}