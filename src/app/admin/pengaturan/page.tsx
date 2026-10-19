import { desc, inArray } from "drizzle-orm";
import AdminShell from "@/components/AdminShell";
import SettingsForm from "@/components/SettingsForm";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { providerStatus } from "@/lib/ai";
import { requireAdmin } from "@/lib/guards";
import { getSettings } from "@/lib/settings";

const TZ = "Asia/Jakarta";

function actionLabel(a: string) {
  if (a === "set_status:approved") return "Menyetujui akses";
  if (a === "set_status:rejected") return "Menolak akses";
  if (a === "set_status:pending") return "Mengembalikan ke menunggu";
  if (a === "update_settings") return "Mengubah pengaturan";
  if (a === "view_conversation") return "Membuka riwayat chat";
  return a;
}

export default async function PengaturanPage() {
  const { user: me } = await requireAdmin();
  const [cfg, logs] = await Promise.all([
    getSettings(),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);

  const ids = [...new Set(logs.flatMap((l) => [l.adminId, l.targetUserId].filter((x): x is string => !!x)))];
  const people = ids.length ? await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, ids)) : [];
  const email = new Map(people.map((p) => [p.id, p.email]));

  return (
    <AdminShell active="pengaturan" email={me.email}>
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-navy">Pengaturan</h2>
        <p className="text-xs text-slate-500">Atur penyedia AI dan batas pemakaian tanpa mengubah kode</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <SettingsForm providers={providerStatus()} initial={cfg} />

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-navy">Log Aktivitas Admin</h3>
            <p className="text-xs text-slate-500">20 tindakan terakhir, termasuk saat admin membuka riwayat chat pengguna</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Tindakan</th>
                  <th className="px-4 py-3">Pengguna terkait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {l.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TZ })}
                    </td>
                    <td className="px-4 py-3">{email.get(l.adminId) ?? l.adminId}</td>
                    <td className="px-4 py-3 font-medium">{actionLabel(l.action)}</td>
                    <td className="px-4 py-3 text-slate-600">{l.targetUserId ? email.get(l.targetUserId) ?? "-" : "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada aktivitas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}