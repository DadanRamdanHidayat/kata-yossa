import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trustedDevices } from "@/db/schema";
import { DEVICE_COOKIE, findTrustedUser } from "./device";

// POST /api/auth/device/sign-in
// Membuat sesi tanpa OTP, hanya untuk perangkat tepercaya milik pelanggan dengan langganan aktif.
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
    },
  }) satisfies BetterAuthPlugin;
