"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  messages?: number;
  tokens?: number;
};

const LABEL: Record<string, string> = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
const BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export default function UserTable({
  users,
  currentUserId,
  title = "Pengguna Terbaru",
  description = "Daftar akun pemohon dan status akses",
  showUsage = false,
  filters = true,
  footer,
}: {
  users: Row[];
  currentUserId: string;
  title?: string;
  description?: string;
  showUsage?: boolean;
  filters?: boolean;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const rows = users.filter(
    (u) => u.email.toLowerCase().includes(q.toLowerCase()) && (filter === "all" || u.status === filter),
  );

  async function setStatus(u: Row, status: "approved" | "rejected") {
    if (!confirm(`Ubah status ${u.email} menjadi "${LABEL[status]}"?`)) return;
    setBusy(u.id);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, status }),
    });
    setBusy(null);
    if (!res.ok) alert((await res.json()).error ?? "Gagal mengubah status.");
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-navy">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {filters && (
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari email..." className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-600" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs">
              <option value="all">Semua status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Daftar</th>
              {showUsage && <th className="px-4 py-3 text-right">Pesan</th>}
              {showUsage && <th className="px-4 py-3 text-right">Token</th>}
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">
                  {u.email}
                  {u.role === "admin" && <span className="ml-2 text-slate-400">(admin)</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 font-semibold ${BADGE[u.status]}`}>{LABEL[u.status]}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.createdAt}</td>
                {showUsage && <td className="px-4 py-3 text-right text-slate-600">{(u.messages ?? 0).toLocaleString("id-ID")}</td>}
                {showUsage && <td className="px-4 py-3 text-right text-slate-600">{(u.tokens ?? 0).toLocaleString("id-ID")}</td>}
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <div className="inline-flex gap-1.5">
                      {u.status !== "approved" && (
                        <button disabled={busy === u.id} onClick={() => setStatus(u, "approved")} className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                          Setujui
                        </button>
                      )}
                      {u.status !== "rejected" && (
                        <button disabled={busy === u.id} onClick={() => setStatus(u, "rejected")} className="rounded bg-red-50 px-2 py-1 font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
                          Tolak
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={showUsage ? 6 : 4} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada pengguna yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t border-slate-100 px-4 py-3 text-right text-xs">{footer}</div>}
    </div>
  );
}