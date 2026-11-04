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
  subscriptionUntil?: string | null; // sudah diformat (WIB)
  subscriptionActive?: boolean;
};

const PLANS = [
  { value: "1d", label: "1 hari" },
  { value: "1w", label: "1 minggu" },
  { value: "1m", label: "1 bulan" },
  { value: "3m", label: "3 bulan" },
  { value: "1y", label: "1 tahun" },
  { value: "none", label: "Tanpa langganan" },
];

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
  showSubscription = false,
  showOtp = false,
  filters = true,
  footer,
}: {
  users: Row[];
  currentUserId: string;
  title?: string;
  description?: string;
  showUsage?: boolean;
  showSubscription?: boolean;
  showOtp?: boolean;
  filters?: boolean;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState<{ email: string; code: string; minutes: number } | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function setPlan(u: Row, plan: string) {
    if (!plan) return;
    const label = PLANS.find((p) => p.value === plan)?.label ?? plan;
    const msg =
      plan === "none"
        ? `Cabut langganan ${u.email}? Perangkatnya akan diminta OTP lagi.`
        : `Atur langganan ${u.email} menjadi ${label}, dihitung dari sekarang?`;
    if (!confirm(msg)) return router.refresh();
    setBusy(u.id);
    const res = await fetch("/api/admin/langganan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id, plan }),
    });
    setBusy(null);
    if (!res.ok) alert((await res.json()).error ?? "Gagal mengatur langganan.");
    router.refresh();
  }

  async function makeOtp(email: string, id: string | null = null) {
    setBusy(id ?? "new-otp");
    const res = await fetch("/api/admin/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error ?? "Gagal membuat kode.");
    setOtp({ email: data.email, code: data.code, minutes: data.expiresInMinutes });
    setCopied(false);
    if (!id) setOtpEmail("");
    router.refresh();
  }

  async function copyOtp() {
    if (!otp) return;
    await navigator.clipboard
      .writeText(`Kode masuk Kata Yossa: ${otp.code} (berlaku ${otp.minutes} menit, sekali pakai)`)
      .catch(() => {});
    setCopied(true);
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
      {showOtp && (
        <div className="space-y-3 border-b border-slate-200 bg-slate-50/60 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (otpEmail.trim()) makeOtp(otpEmail.trim());
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              placeholder="Email pengguna (baru atau lama) untuk dibuatkan kode masuk"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-600"
            />
            <button disabled={busy === "new-otp"} className="rounded-lg bg-navy px-4 py-2 text-xs font-medium text-white hover:bg-blue-900 disabled:opacity-60">
              {busy === "new-otp" ? "Membuat..." : "Buat kode masuk"}
            </button>
          </form>
          {otp && (
            <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                Kode untuk <span className="font-semibold text-slate-900">{otp.email}</span>
                <div className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-navy">{otp.code}</div>
                <p className="mt-1">Berlaku {otp.minutes} menit dan hanya bisa dipakai sekali. Kode ini tidak akan ditampilkan lagi.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyOtp} className="rounded bg-white px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100">
                  {copied ? "Tersalin" : "Salin pesan"}
                </button>
                <button onClick={() => setOtp(null)} className="rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-white">Tutup</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Daftar</th>
              {showSubscription && <th className="px-4 py-3">Langganan</th>}
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
                {showSubscription && (
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="text-slate-400">-</span>
                    ) : u.subscriptionUntil ? (
                      <span className={u.subscriptionActive ? "font-medium text-emerald-700" : "text-slate-400"}>
                        {u.subscriptionActive ? `Aktif s.d. ${u.subscriptionUntil}` : `Berakhir ${u.subscriptionUntil}`}
                      </span>
                    ) : (
                      <span className="text-slate-400">Tanpa langganan</span>
                    )}
                  </td>
                )}
                {showUsage && <td className="px-4 py-3 text-right text-slate-600">{(u.messages ?? 0).toLocaleString("id-ID")}</td>}
                {showUsage && <td className="px-4 py-3 text-right text-slate-600">{(u.tokens ?? 0).toLocaleString("id-ID")}</td>}
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <div className="inline-flex items-center gap-1.5">
                      {showSubscription && u.status === "approved" && u.role !== "admin" && (
                        <select
                          disabled={busy === u.id}
                          value=""
                          onChange={(e) => setPlan(u, e.target.value)}
                          className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-700 disabled:opacity-50"
                        >
                          <option value="">Atur langganan…</option>
                          {PLANS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      )}
                      {showOtp && u.role !== "admin" && u.status !== "rejected" && (
                        <button disabled={busy === u.id} onClick={() => makeOtp(u.email, u.id)} className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                          Buat OTP
                        </button>
                      )}
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
                <td colSpan={4 + (showUsage ? 2 : 0) + (showSubscription ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">
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