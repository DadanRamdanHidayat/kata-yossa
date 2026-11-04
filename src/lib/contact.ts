// Nomor WhatsApp admin dari NEXT_PUBLIC_ADMIN_WA (format internasional tanpa +, mis. 6281234567890).
// Kosong = tautan tidak ditampilkan.
export function adminWaLink(text?: string) {
  const number = (process.env.NEXT_PUBLIC_ADMIN_WA ?? "").replace(/\D/g, "");
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
