import Link from "next/link";
import SignOutButton from "./SignOutButton";

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M16 38C14 26 24 16 34 14C34 24 26 34 16 38Z" fill="#3B82F6" />
      <path d="M42 22C44 34 34 44 24 46C24 36 32 26 42 22Z" fill="#93C5FD" />
    </svg>
  );
}

const NAV = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "pengguna", label: "Kelola Pengguna", href: "/admin/pengguna" },
  { key: "riwayat", label: "Riwayat Chat", href: "/admin/riwayat" },
  { key: "pengaturan", label: "Pengaturan", href: "/admin/pengaturan" },
];

export default function AdminShell({
  active,
  email,
  children,
}: {
  active: "dashboard" | "pengguna" | "riwayat" | "pengaturan";
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-navy text-white md:flex">
        <div>
          <div className="flex items-center gap-2.5 border-b border-white/10 p-5">
            <Mark />
            <span className="text-sm font-bold tracking-wide">KATA YOSSA</span>
          </div>
          <nav className="space-y-1 p-3">
            {NAV.map((n) =>
              n.href ? (
                <Link
                  key={n.key}
                  href={n.href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    n.key === active
                      ? "border border-blue-500/30 bg-blue-600/30 text-blue-300"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {n.label}
                </Link>
              ) : (
                <div key={n.key} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500">
                  {n.label}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Segera</span>
                </div>
              ),
            )}
          </nav>
        </div>
        <div className="space-y-1 border-t border-white/10 p-4">
          <p className="truncate px-3 text-xs text-slate-400">{email}</p>
          <Link href="/chat" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white">
            ← Kembali ke Chat
          </Link>
          <SignOutButton tone="dark" className="w-full text-left !text-xs" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-navy px-4 py-3 text-white md:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-bold">
              <Mark /> KATA YOSSA
            </span>
            <SignOutButton tone="dark" className="!px-0 !py-0 !text-xs" />
          </div>
          <nav className="flex gap-4 overflow-x-auto whitespace-nowrap text-xs font-medium text-slate-300">
            {NAV.map((n) => (
              <Link key={n.key} href={n.href!} className={n.key === active ? "text-blue-300" : ""}>
                {n.label}
              </Link>
            ))}
            <Link href="/chat">Chat</Link>
          </nav>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}