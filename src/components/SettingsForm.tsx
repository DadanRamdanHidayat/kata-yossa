"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Provider = { name: string; hasKey: boolean; model: string };

const field =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export default function SettingsForm({
  providers,
  initial,
}: {
  providers: Provider[];
  initial: { aiProvider: string; aiFallback: string; dailyMessageLimit: number; tokenLimit: number };
}) {
  const router = useRouter();
  const [aiProvider, setAiProvider] = useState(initial.aiProvider);
  const [aiFallback, setAiFallback] = useState(initial.aiFallback);
  const [dailyMessageLimit, setDaily] = useState(String(initial.dailyMessageLimit));
  const [tokenLimit, setTokenLimit] = useState(String(initial.tokenLimit));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aiProvider,
        aiFallback,
        dailyMessageLimit: Number(dailyMessageLimit),
        tokenLimit: Number(tokenLimit),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Pengaturan tersimpan." });
      router.refresh();
    } else {
      setMsg({ ok: false, text: (await res.json()).error ?? "Gagal menyimpan." });
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-navy">Penyedia AI</h3>
        <p className="mb-4 text-xs text-slate-500">
          Pilih penyedia yang menjawab chat. Kalau penyedia utama gagal atau kuotanya habis, cadangan dipakai otomatis.
          API key tidak bisa diubah di sini, karena disimpan aman di environment (.env.local / Vercel).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Penyedia utama</label>
            <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className={field}>
              {providers.map((p) => (
                <option key={p.name} value={p.name} disabled={!p.hasKey}>
                  {p.name}{p.hasKey ? "" : " (key belum diisi)"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Penyedia cadangan</label>
            <select value={aiFallback} onChange={(e) => setAiFallback(e.target.value)} className={field}>
              <option value="">Tidak ada</option>
              {providers
                .filter((p) => p.name !== aiProvider)
                .map((p) => (
                  <option key={p.name} value={p.name} disabled={!p.hasKey}>
                    {p.name}{p.hasKey ? "" : " (key belum diisi)"}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">Penyedia</th>
                <th className="px-3 py-2">API key</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((p) => (
                <tr key={p.name}>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 font-semibold ${p.hasKey ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.hasKey ? "Terpasang" : "Belum diisi"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{p.model || "-"}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {p.name === aiProvider ? "Utama" : p.name === aiFallback ? "Cadangan" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-navy">Batas Pemakaian</h3>
        <p className="mb-4 text-xs text-slate-500">Mengendalikan biaya AI dan tampilan persentase di dashboard.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Batas pesan per pengguna per hari</label>
            <input type="number" min={1} required value={dailyMessageLimit} onChange={(e) => setDaily(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Batas token total (untuk persentase di dashboard)</label>
            <input type="number" min={1000} required value={tokenLimit} onChange={(e) => setTokenLimit(e.target.value)} className={field} />
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button disabled={saving} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60">
          {saving ? "Menyimpan..." : "Simpan pengaturan"}
        </button>
        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
      </div>
    </form>
  );
}