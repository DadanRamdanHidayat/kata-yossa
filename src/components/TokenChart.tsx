type Point = { label: string; input: number; output: number };

export default function TokenChart({ data }: { data: Point[] }) {
  const W = 600;
  const H = 160;
  const pad = 14;
  const max = Math.max(1, ...data.flatMap((d) => [d.input, d.output]));
  const empty = data.every((d) => d.input === 0 && d.output === 0);

  const x = (i: number) => ((i + 0.5) * W) / data.length;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const path = (key: "input" | "output") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Grafik penggunaan token 7 hari terakhir">
          {[0, 0.33, 0.66, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} stroke={f === 0 ? "#E2E8F0" : "#F1F5F9"} strokeWidth="1" />
          ))}
          {!empty && (
            <>
              <path d={path("output")} fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={path("input")} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {data.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d.input)} r="3.5" fill="#2563EB" />
              ))}
            </>
          )}
        </svg>
        {empty && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Belum ada penggunaan token dalam 7 hari terakhir
          </p>
        )}
        {!empty && (
          <span className="absolute left-0 top-0 text-[10px] text-slate-400">Maks {max.toLocaleString("id-ID")} token</span>
        )}
      </div>
      <div className="grid border-t border-slate-100 pt-2 text-center text-[10px] text-slate-500" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}