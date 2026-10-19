import AppShell from "@/components/Sidebar";
import SignOutButton from "@/components/SignOutButton";
import { requireApproved } from "@/lib/guards";

export default async function ProfilPage() {
  const { user } = await requireApproved();
  const fields = [
    { label: "Email", value: user.email },
    { label: "Status akses", value: "Disetujui" },
    { label: "Terdaftar pada", value: new Date(user.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" }) },
  ];

  return (
    <AppShell active="profil" isAdmin={user.role === "admin"} email={user.email} title="Profil" subtitle="Informasi akun Anda">
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
        <h2 className="text-xl font-bold text-navy">Profil</h2>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="mb-1 text-xs text-slate-500">{f.label}</p>
              <p className="rounded-lg bg-slate-50 p-2.5 text-sm font-medium">{f.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Percakapan Anda dapat ditinjau oleh admin sesuai kebijakan privasi Kata Yossa.
        </p>
        <SignOutButton className="bg-red-50 !text-red-600 hover:!bg-red-100" />
      </div>
    </AppShell>
  );
}