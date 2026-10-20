"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginCodeForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ email: string; otp: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);
    const res = await fetch("/api/admin/login-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Gagal membuat kode.");
    setResult(data);
    setEmail("");
    router.refresh(); // perbarui tabel (status jadi Disetujui)
  }

  const message = result
    ? `Kode masuk Kata Yossa Anda: ${result.otp}\n\nBuka ${window.location.origin}/masuk, isi email ${result.email}, pilih "Punya kode dari admin", lalu masukkan kode ini. Berlaku 5 menit.`
    : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-navy">Buat Kode Masuk</h3>
      <p className="mb-4 text-xs text-slate-500">
        Untuk pengguna yang belum bisa menerima OTP lewat email. Kode ini sekaligus menyetujui akses email tersebut.
        Kirim kodenya sendiri, misalnya lewat WhatsApp.
      </p>
      <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@pengguna.com"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />
        <button disabled={loading} className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60">
          {loading ? "Membuat..." : "Buat kode"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-800">Kode untuk <span className="font-semibold">{result.email}</span> (berlaku 5 menit):</p>
          <p className="my-2 text-3xl font-bold tracking-[0.3em] text-emerald-700">{result.otp}</p>
          <pre className="mb-3 whitespace-pre-wrap rounded bg-white p-3 text-[11px] text-slate-600">{message}</pre>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(message);
              setCopied(true);
            }}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            {copied ? "Tersalin" : "Salin pesan"}
          </button>
        </div>
      )}
    </div>
  );
}
