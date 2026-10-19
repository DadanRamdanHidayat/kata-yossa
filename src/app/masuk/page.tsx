import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";
import { getSession } from "@/lib/guards";

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getSession()) redirect("/chat");
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center"><Logo size={32} /></div>
          <p className="text-sm text-slate-500">Masuk untuk melanjutkan</p>
        </div>
        <LoginForm defaultEmail={email ?? ""} />
        <div className="mt-6 border-t border-slate-200 pt-4 text-center">
          <Link href="/" className="text-xs font-medium text-slate-500 hover:text-blue-600">Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  );
}
