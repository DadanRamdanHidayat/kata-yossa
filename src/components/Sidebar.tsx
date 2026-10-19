import { History, MessageSquare, Shield, User } from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";
import SignOutButton from "./SignOutButton";

type Props = {
  active: "chat" | "riwayat" | "profil";
  isAdmin: boolean;
  email: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const ITEMS = [
  { key: "chat", href: "/chat", label: "Chat Saya", short: "Chat", Icon: MessageSquare },
  { key: "riwayat", href: "/riwayat", label: "Riwayat Chat", short: "Riwayat", Icon: History },
  { key: "profil", href: "/profil", label: "Profil", short: "Profil", Icon: User },
];

export default function AppShell({ active, isAdmin, email, title, subtitle, action, children }: Props) {
  const items = isAdmin
    ? [...ITEMS, { key: "admin", href: "/admin", label: "Admin Dashboard", short: "Admin", Icon: Shield }]
    : ITEMS;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white md:flex">
        <div>
          <div className="flex items-center border-b border-slate-200 p-5">
            <Logo />
          </div>
          <nav className="space-y-1 p-3">
            {items.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active === item.key ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-200 p-4">
          <SignOutButton withIcon className="w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-slate-50/50">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="md:hidden">
            <Logo size={22} />
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {action}
            <Link href="/profil" className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {email[0]?.toUpperCase()}
              </span>
              <span className="hidden text-xs font-medium text-slate-900 sm:inline">{email}</span>
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>

        {/* Tab bar mobile */}
        <nav className="flex shrink-0 justify-around border-t border-slate-200 bg-white py-2 md:hidden">
          {items.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center text-[10px] font-medium ${active === item.key ? "text-blue-600" : "text-slate-500"}`}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                {item.short}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}