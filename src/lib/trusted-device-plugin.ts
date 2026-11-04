import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginCodes, trustedDevices, user } from "@/db/schema";
import { DEVICE_COOKIE, findTrustedUser } from "./device";
import { CODE_MAX_ATTEMPTS, hashLoginCode, sameHash } from "./login-code";

// Dua jalur masuk tanpa OTP email, keduanya membuat sesi Better Auth biasa:
//  POST /api/auth/device/sign-in  -> perangkat tepercaya milik pelanggan dengan langganan aktif
//  POST /api/auth/code/sign-in    -> kode satu kali yang dibuat admin di dashboard (pengguna non-admin)
export const trustedDevice = () =>
  ({
    id: "trusted-device",
    endpoints: {
      deviceSignIn: createAuthEndpoint("/device/sign-in", { method: "POST" }, async (ctx) => {
        const token = ctx.getCookie(DEVICE_COOKIE);
        const found = token ? await findTrustedUser(token) : null;
        if (!found) {
          throw new APIError("UNAUTHORIZED", { message: "Perangkat tidak dikenali atau langganan sudah berakhir." });
        }

        const authUser = await ctx.context.internalAdapter.findUserById(found.userId);
        if (!authUser) throw new APIError("UNAUTHORIZED", { message: "Akun tidak ditemukan." });

        const session = await ctx.context.internalAdapter.createSession(authUser.id);
        await setSessionCookie(ctx, { session, user: authUser });
        await db.update(trustedDevices).set({ lastUsedAt: new Date() }).where(eq(trustedDevices.id, found.deviceId));

        return ctx.json({ ok: true });
      }),

      codeSignIn: createAuthEndpoint("/code/sign-in", { method: "POST" }, async (ctx) => {
        const body = (ctx.body ?? {}) as { email?: unknown; code?: unknown };
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
        // Semua kegagalan memakai pesan yang sama supaya tidak membocorkan email mana yang terdaftar.
        const fail = () => new APIError("UNAUTHORIZED", { message: "Kode salah atau sudah kedaluwarsa." });
        if (!email || code.length !== 6) throw fail();

        const [u] = await db.select({ id: user.id, role: user.role, status: user.status }).from(user).where(eq(user.email, email)).limit(1);
        if (!u || u.role === "admin" || u.status !== "approved") throw fail();

        // Percobaan dihitung secara atomik sebelum membandingkan, jadi tebakan paralel pun dibatasi.
        const [claimed] = await db
          .update(loginCodes)
          .set({ attempts: sql`${loginCodes.attempts} + 1` })
          .where(and(eq(loginCodes.userId, u.id), gt(loginCodes.expiresAt, new Date()), lt(loginCodes.attempts, CODE_MAX_ATTEMPTS)))
          .returning();
        if (!claimed) throw fail();
        if (!sameHash(claimed.codeHash, hashLoginCode(u.id, code))) throw fail();

        await db.delete(loginCodes).where(eq(loginCodes.id, claimed.id)); // sekali pakai

        const authUser = await ctx.context.internalAdapter.findUserById(u.id);
        if (!authUser) throw fail();
        const session = await ctx.context.internalAdapter.createSession(authUser.id);
        await setSessionCookie(ctx, { session, user: authUser });
        return ctx.json({ ok: true });
      }),
    },
  }) satisfies BetterAuthPlugin;