"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { TERMS_VERSION } from "@/lib/legal";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { createSubscription } from "@/server/billing";
import type { FormState } from "@/components/FormMessage";

const signupSchema = z.object({
  name: z.string().trim().min(2, "נא להזין שם מלא"),
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
  password: z.string().min(8, "סיסמה של 8 תווים לפחות"),
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
  redirect("/subscribe");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "נא להזין סיסמה"),
});

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
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
