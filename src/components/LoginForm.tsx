"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const input =
  "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const primary =
  "w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60";

export default function LoginForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setLoading(false);
    if (error) return setError("Gagal mengirim kode. Periksa email Anda lalu coba lagi.");
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await authClient.signIn.emailOtp({ email, otp });
    if (error) {
      setLoading(false);
      return setError("Kode salah atau sudah kedaluwarsa.");
    }
    router.push("/chat"); // halaman chat mengarahkan ke /status jika belum disetujui
    router.refresh();
  }

  if (step === "email") {
    return (
      <form onSubmit={sendOtp} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold" htmlFor="email">Email Anda</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@domain.com" className={input} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button disabled={loading} className={primary}>{loading ? "Mengirim..." : "Kirim kode OTP"}</button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <p className="text-xs text-slate-500">
        Kami mengirim kode 6 digit ke <span className="font-medium text-slate-900">{email}</span>.
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
        <button type="button" onClick={() => sendOtp()} className="font-medium text-blue-600 hover:underline">Kirim ulang kode</button>
      </div>
    </form>
  );
}
