export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M16 38C14 26 24 16 34 14C34 24 26 34 16 38Z" fill="#2563EB" />
      <path d="M42 22C44 34 34 44 24 46C24 36 32 26 42 22Z" fill="#172554" />
    </svg>
  );
}

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-bold tracking-tight text-navy">KATA YOSSA</span>
    </span>
  );
}