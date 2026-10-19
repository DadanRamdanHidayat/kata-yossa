import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

// Penjaga awal saja (cek ada tidaknya cookie sesi).
// Pemeriksaan status & role yang sebenarnya ada di lib/guards.ts dan API routes.
export function middleware(req: NextRequest) {
  if (!getSessionCookie(req)) return NextResponse.redirect(new URL("/masuk", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/profil/:path*", "/admin/:path*", "/status/:path*"],
};
