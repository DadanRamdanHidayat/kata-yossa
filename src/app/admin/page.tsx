import Link from "next/link";
import { and, count, desc, eq, gte, lt, sum } from "drizzle-orm";
import AdminShell from "@/components/AdminShell";
import TokenChart from "@/components/TokenChart";
import UserTable from "@/components/UserTable";
import { db } from "@/db";
import { messages, usageLogs, user } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";
import { getSettings } from "@/lib/settings";

const TZ = "Asia/Jakarta"; // UTC+7, tanpa DST
const DAY = 86_400_000;
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function AdminPage() {
  const { user: me } = await requireAdmin();

  const now = new Date();
  const startToday = new Date(`${dayKey(now)}T00:00:00+07:00`);
  const startYesterday = new Date(startToday.getTime() - DAY);
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since7 = new Date(startToday.getTime() - 6 * DAY);
  const userMsg = eq(messages.role, "user");

  const [users, [total], [newUsersRow], [pending], [chatToday], [chatYesterday], [usage], recentLogs] = await Promise.all([
    db.select().from(user).orderBy(desc(user.createdAt)).limit(5),
    db.select({ n: count() }).from(user),
    db.select({ n: count() }).from(user).where(gte(user.createdAt, since30)),
    db.select({ n: count() }).from(user).where(eq(user.status, "pending")),
    db.select({ n: count() }).from(messages).where(and(userMsg, gte(messages.createdAt, startToday))),
    db.select({ n: count() }).from(messages).where(and(userMsg, gte(messages.createdAt, startYesterday), lt(messages.createdAt, startToday))),
    db.select({ tin: sum(usageLogs.inputTokens), tout: sum(usageLogs.outputTokens), cost: sum(usageLogs.costUsd) }).from(usageLogs),
    db
      .select({ i: usageLogs.inputTokens, o: usageLogs.outputTokens, at: usageLogs.createdAt })
      .from(usageLogs)
      .where(gte(usageLogs.createdAt, since7)),
  ]);

  // Statistik kartu
  const newUsers = newUsersRow.n;
  const chatDiff = chatToday.n - chatYesterday.n;
  const tokens = Number(usage.tin ?? 0) + Number(usage.tout ?? 0);
  const cost = Number(usage.cost ?? 0);
  const tokenLimit = (await getSettings()).tokenLimit;
  const pct = Math.min(100, Math.round((tokens / tokenLimit) * 100));

  // Data grafik 7 hari terakhir
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startToday.getTime() + (i - 6) * DAY);
    return {
      key: dayKey(d),
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: TZ }),
      input: 0,
      output: 0,
    };
  });
  for (const log of recentLogs) {
    const day = days.find((d) => d.key === dayKey(log.at));
    if (day) {
      day.input += log.i;
      day.output += log.o;
    }
  }

  const stats = [
    { label: "Total Pengguna", value: String(total.n), sub: `+${newUsers} dalam 30 hari`, tone: "text-emerald-600" },
    { label: "Chat Hari Ini", value: String(chatToday.n), sub: `${chatDiff >= 0 ? "+" : ""}${chatDiff} dari kemarin`, tone: chatDiff >= 0 ? "text-emerald-600" : "text-red-600" },
    { label: "Token Terpakai", value: compact(tokens), sub: `${pct}% dari limit • ≈ $${cost.toFixed(4)}`, tone: "text-emerald-600" },
    { label: "Menunggu Persetujuan", value: String(pending.n), sub: "Perlu tinjauan admin", tone: "text-slate-500", valueTone: "text-amber-600" },
  ];

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    status: u.status,
    role: u.role,
    createdAt: u.createdAt.toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: TZ }),
  }));

  return (
    <AdminShell active="dashboard" email={me.email}>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-navy">Dashboard Admin</h2>
          <p className="text-xs text-slate-500">Pantau metrik persetujuan akses pengguna & statistik sistem</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Sistem Aktif
        </span>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className={`mt-1 text-2xl font-bold ${s.valueTone ?? "text-navy"}`}>{s.value}</div>
              <div className={`mt-1 text-[11px] font-medium ${s.tone}`}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-navy">Penggunaan Token</h3>
              <p className="text-xs text-slate-500">Aktivitas input & output model AI 7 hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-blue-600"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Input</span>
              <span className="flex items-center gap-1 text-sky-500"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Output</span>
            </div>
          </div>
          <TokenChart data={days} />
        </div>

        <UserTable
          users={rows}
          currentUserId={me.id}
          filters={false}
          footer={
            <Link href="/admin/pengguna" className="font-medium text-blue-600 hover:underline">
              Lihat semua pengguna →
            </Link>
          }
        />
      </div>
    </AdminShell>
  );
}