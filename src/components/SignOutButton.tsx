"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton({
  className = "",
  tone = "light",
  withIcon = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  withIcon?: boolean;
}) {
  const router = useRouter();
  const color =
    tone === "dark"
      ? "text-slate-300 hover:bg-white/10 hover:text-white"
      : "text-slate-600 hover:bg-red-50 hover:text-red-600";
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
      className={`inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${color} ${className}`}
    >
      {withIcon && <LogOut className="h-4 w-4" />}
      Keluar
    </button>
  );
}