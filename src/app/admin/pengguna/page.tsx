import { count, desc, eq, sum } from "drizzle-orm";
import AdminShell from "@/components/AdminShell";
import UserTable from "@/components/UserTable";
import { db } from "@/db";
import { conversations, messages, usageLogs, user } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";

const TZ = "Asia/Jakarta";

export default async function KelolaPenggunaPage() {
  const { user: me } = await requireAdmin();

  const [users, msgCounts, tokenSums] = await Promise.all([
    db.select().from(user).orderBy(desc(user.createdAt)).limit(500),
    db
      .select({ userId: conversations.userId, n: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(messages.role, "user"))
      .groupBy(conversations.userId),
    db
      .select({ userId: usageLogs.userId, tin: sum(usageLogs.inputTokens), tout: sum(usageLogs.outputTokens) })
      .from(usageLogs)
      .groupBy(usageLogs.userId),
  ]);

  const msgMap = new Map(msgCounts.map((r) => [r.userId, r.n]));
  const tokMap = new Map(tokenSums.map((r) => [r.userId, Number(r.tin ?? 0) + Number(r.tout ?? 0)]));

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    status: u.status,
    role: u.role,
    createdAt: u.createdAt.toLocaleDateString("id-ID", { dateStyle: "medium", timeZone: TZ }),
    messages: msgMap.get(u.id) ?? 0,
    tokens: tokMap.get(u.id) ?? 0,
  }));

  const stats = [
    { label: "Semua akun", value: users.length, tone: "text-navy" },
    { label: "Menunggu", value: users.filter((u) => u.status === "pending").length, tone: "text-amber-600" },
    { label: "Disetujui", value: users.filter((u) => u.status === "approved").length, tone: "text-emerald-600" },
    { label: "Ditolak", value: users.filter((u) => u.status === "rejected").length, tone: "text-red-600" },
  ];

  return (
    <AdminShell active="pengguna" email={me.email}>
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-navy">Kelola Pengguna</h2>
        <p className="text-xs text-slate-500">Setujui atau tolak akses, dan pantau pemakaian tiap akun</p>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{s.label}</span>
              <div className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <UserTable
          users={rows}
          currentUserId={me.id}
          title="Daftar Pengguna"
          description="Semua akun yang terdaftar, beserta jumlah pesan dan token yang dipakai"
          showUsage
        />
      </div>
    </AdminShell>
  );
}