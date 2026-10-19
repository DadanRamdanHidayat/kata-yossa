import { asc, eq, sum } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { db } from "@/db";
import { auditLogs, conversations, messages, usageLogs, user } from "@/db/schema";
import { requireAdmin } from "@/lib/guards";

const TZ = "Asia/Jakarta";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminRiwayatDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user: me } = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [conv] = await db
    .select({ title: conversations.title, createdAt: conversations.createdAt, userId: conversations.userId, email: user.email })
    .from(conversations)
    .innerJoin(user, eq(conversations.userId, user.id))
    .where(eq(conversations.id, id));
  if (!conv) notFound();

  const [msgs, [usage]] = await Promise.all([
    db.select({ role: messages.role, content: messages.content, createdAt: messages.createdAt }).from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt)),
    db.select({ tin: sum(usageLogs.inputTokens), tout: sum(usageLogs.outputTokens), cost: sum(usageLogs.costUsd) }).from(usageLogs).where(eq(usageLogs.conversationId, id)),
  ]);

  // Akses admin ke chat pengguna selalu dicatat
  await db.insert(auditLogs).values({ adminId: me.id, action: "view_conversation", targetUserId: conv.userId });

  const tokens = Number(usage.tin ?? 0) + Number(usage.tout ?? 0);

  return (
    <AdminShell active="riwayat" email={me.email}>
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/admin/riwayat" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar
        </Link>
        <h2 className="text-lg font-bold text-navy">{conv.title}</h2>
        <p className="text-xs text-slate-500">
          {conv.email} • dimulai {conv.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TZ })} •{" "}
          {msgs.length} pesan • {tokens.toLocaleString("id-ID")} token • ≈ ${Number(usage.cost ?? 0).toFixed(4)}
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Tampilan hanya-baca. Akses ini tercatat di Log Aktivitas Admin.
        </p>
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === "user" ? "rounded-tr-sm bg-navy text-white" : "rounded-tl-sm border border-slate-200 bg-white"}`}>
              {m.content}
              <p className={`mt-1.5 text-[10px] ${m.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                {m.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}