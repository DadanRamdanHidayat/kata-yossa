// Awal hari ini menurut WIB (UTC+7, tanpa daylight saving), apa pun zona waktu server (Vercel memakai UTC).
export function startOfDayWIB(now = Date.now()) {
  const DAY = 24 * 60 * 60 * 1000;
  const WIB = 7 * 60 * 60 * 1000;
  return new Date(Math.floor((now + WIB) / DAY) * DAY - WIB);
}
