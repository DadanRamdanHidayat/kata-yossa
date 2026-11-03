import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import * as schema from "@/db/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
      status: { type: "string", defaultValue: "pending", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // pengguna biasa: 7 hari
    updateAge: 60 * 60 * 24 * 365, // matikan perpanjangan otomatis, masa berlaku tetap dihitung dari saat login
  },
  databaseHooks: {
    session: {
      create: {
        // Admin: sesi hanya 24 jam sejak OTP dimasukkan, besoknya wajib OTP lagi.
        before: async (sess) => {
          const [u] = await db.select({ role: schema.user.role }).from(schema.user).where(eq(schema.user.id, sess.userId)).limit(1);
          if (u?.role === "admin") {
            return { data: { ...sess, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } };
          }
          return { data: sess };
        },
      },
    },
    user: {
      create: {
        // Role & status ditentukan server, bukan input pengguna.
        before: async (u) => {
          const isAdmin = adminEmails.includes(u.email.toLowerCase());
          return {
            data: { ...u, role: isAdmin ? "admin" : "user", status: isAdmin ? "approved" : "pending" },
          };
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp }) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n[DEV] OTP untuk ${email}: ${otp}\n`);
        }
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "Kata Yossa <onboarding@resend.dev>",
          to: email,
          subject: "Kode verifikasi Kata Yossa",
          html: `<p>Kode OTP Anda:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>Berlaku 5 menit. Abaikan email ini jika Anda tidak meminta kode.</p>`,
        });
        if (error) {
          console.error("Resend error:", error);
          throw new Error(error.message);
        }
      },
    }),
    nextCookies(),
  ],
});
