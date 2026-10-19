import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import { requireUser } from "@/lib/guards";

export default async function StatusPage() {
  const { user } = await requireUser();
  if (user.status === "approved") redirect("/chat");
  const rejected = user.status === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-navy">
          {rejected ? "Akses belum dapat diberikan" : "Akses Anda sedang ditinjau"}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          {rejected
            ? "Mohon maaf, permintaan akses untuk akun ini belum dapat disetujui saat ini."
            : "Terima kasih telah mendaftar. Tim kami akan meninjau permintaan akses Anda. Silakan cek kembali nanti."}
        </p>
        <p className="mb-6 text-xs text-slate-400">Masuk sebagai {user.email}</p>
        <div className="flex flex-col gap-2">
          {!rejected && (
            <Link href="/chat" className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-900">
              Periksa status
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
