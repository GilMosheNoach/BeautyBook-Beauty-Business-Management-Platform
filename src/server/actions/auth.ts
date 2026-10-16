"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import { db } from "@/lib/db";
import { TERMS_VERSION } from "@/lib/legal";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isRateLimited, rateLimit } from "@/lib/rateLimit";
import { getSession } from "@/lib/session";
import { createSubscription } from "@/server/billing";
import type { FormState } from "@/components/FormMessage";

const signupSchema = z.object({
  name: z.string().trim().min(2, "נא להזין שם מלא").max(80, "השם ארוך מדי"),
  email: z.string().trim().toLowerCase().max(254, "כתובת אימייל ארוכה מדי").email("כתובת אימייל לא תקינה"),
  password: z.string().min(8, "סיסמה של 8 תווים לפחות").max(200, "הסיסמה ארוכה מדי"),
  ref: z.string().max(32).optional(),
  acceptTerms: z.literal("on", { message: "יש לאשר את תנאי השימוש ומדיניות הפרטיות" }),
});

export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "כבר קיים חשבון עם האימייל הזה. אפשר להתחבר." };

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
  });
  await createSubscription(user.id, parsed.data.ref);
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/onboarding");
}

const LOGIN_FAILURES_PER_EMAIL = 10;
const LOGIN_FAILURES_PER_IP = 30;
const LOGIN_WINDOW_MS = 15 * 60_000;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "נא להזין סיסמה").max(200),
});

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // Slows down password guessing: failed attempts per address, and per visitor across addresses.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const keys = [`login:${parsed.data.email}`, `login-ip:${ip}`];
  if (isRateLimited(keys[0], LOGIN_FAILURES_PER_EMAIL) || isRateLimited(keys[1], LOGIN_FAILURES_PER_IP)) {
    return { error: "יותר מדי ניסיונות כניסה. נסי שוב בעוד כמה דקות." };
  }
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    rateLimit(keys[0], LOGIN_FAILURES_PER_EMAIL, LOGIN_WINDOW_MS);
    rateLimit(keys[1], LOGIN_FAILURES_PER_IP, LOGIN_WINDOW_MS);
    return { error: "אימייל או סיסמה שגויים" };
  }
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
