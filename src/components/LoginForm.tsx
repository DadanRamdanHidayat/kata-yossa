"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const input =
  "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const primary =
  "w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60";

export default function LoginForm({ defaultEmail = "", trustedEmail }: { defaultEmail?: string; trustedEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useOther, setUseOther] = useState(false);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setLoading(false);
    if (error) return setError("Gagal memproses email. Periksa email Anda lalu coba lagi.");
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Pengguna biasa: kode dari admin. Admin: kode yang dikirim ke emailnya.
    const viaAdminCode = await fetch("/api/auth/code/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    }).catch(() => null);
    if (!viaAdminCode?.ok) {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) {
        setLoading(false);
        return setError("Kode salah atau sudah kedaluwarsa.");
      }
    }
    // Kalau langganan pengguna aktif, tandai browser ini agar berikutnya bisa masuk tanpa OTP.
    await fetch("/api/device", { method: "POST" }).catch(() => {});
    router.push("/chat"); // halaman chat mengarahkan ke /status jika belum disetujui
    router.refresh();
  }

  async function continueAsTrusted() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/device/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => null);
    if (!res || !res.ok) {
      setLoading(false);
      setUseOther(true);
      return setError("Akses perangkat ini sudah berakhir. Silakan masuk dengan kode OTP.");
    }
    router.push("/chat");
    router.refresh();
  }

  async function forgetDevice() {
    setLoading(true);
    await fetch("/api/device", { method: "DELETE" }).catch(() => {});
    setLoading(false);
    setUseOther(true);
    router.refresh();
  }

  if (trustedEmail && !useOther && step === "email") {
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Perangkat ini sudah dikenali, Anda tidak perlu kode OTP.</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={continueAsTrusted} disabled={loading} className={primary}>
          {loading ? "Masuk..." : `Lanjutkan sebagai ${trustedEmail}`}
        </button>
        <div className="flex justify-between text-xs">
          <button type="button" onClick={() => setUseOther(true)} className="text-slate-500 hover:text-slate-900">Masuk dengan email lain</button>
          <button type="button" onClick={forgetDevice} disabled={loading} className="text-slate-500 hover:text-red-600">Bukan Anda? Hapus akses perangkat ini</button>
        </div>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form onSubmit={sendOtp} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold" htmlFor="email">Email Anda</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@domain.com" className={input} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className={primary}>{loading ? "Memproses..." : "Lanjut"}</button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-xs text-slate-500">
        Masukkan kode 6 digit untuk <span className="font-medium text-slate-900">{email}</span>.
      </p>
      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        Pengguna: minta kode ke admin Kata Yossa. Admin: kode dikirim ke email Anda.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className={`${input} text-center text-xl font-bold tracking-[0.5em]`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button disabled={loading || otp.length < 6} className={primary}>{loading ? "Memverifikasi..." : "Verifikasi & masuk"}</button>
      <div className="flex justify-between text-xs">
        <button type="button" onClick={() => setStep("email")} className="text-slate-500 hover:text-slate-900">Ganti email</button>
        <button type="button" onClick={() => sendOtp()} className="font-medium text-blue-600 hover:underline">Kirim ulang (admin)</button>
      </div>
    </form>
  );
}
