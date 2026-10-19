import Link from "next/link";
import Logo from "@/components/Logo";

const BENEFITS = [
  { title: "Analisis berbasis data", text: "Evaluasi potensi dan risiko pasar secara terukur." },
  { title: "Strategi bisnis yang tepat", text: "Fondasi eksekusi model bisnis yang jelas." },
  { title: "Rekomendasi terarah", text: "Langkah operasional yang bertahap dan konkret." },
  { title: "Pendampingan berkelanjutan", text: "Partner AI kapan pun Anda butuh arahan." },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-slate-50">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-12">
        <Logo />
        <Link href="/masuk" className="rounded-lg bg-navy px-5 py-2 text-sm font-medium text-white hover:bg-blue-900">
          Masuk
        </Link>
      </nav>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy md:text-5xl">KATA YOSSA</h1>
        <p className="mt-3 text-lg font-medium md:text-xl">Solusi Persiapan Bisnis dan Memperkuat Arah Bisnis</p>
        <p className="mb-8 mt-2 max-w-lg text-sm text-slate-500 md:text-base">
          Selamat datang. Saya siap membantu Anda mempersiapkan dan memperkuat arah bisnis.
        </p>

        <form action="/masuk" className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md sm:flex-row">
          <input name="email" type="email" required placeholder="Masukkan email Anda" className="flex-1 rounded-lg px-3.5 py-2.5 text-sm outline-none" />
          <button className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-900">Mulai sekarang</button>
        </form>

        <div className="mt-16 grid w-full grid-cols-2 gap-4 text-left md:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-navy">{b.title}</h3>
              <p className="text-xs text-slate-500">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
