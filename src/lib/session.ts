import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAccess } from "./billing";
import { db } from "./db";

export type SessionData = { userId?: string };

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return {
    password,
    cookieName: "bb_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    },
  };
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  return db.user.findUnique({ where: { id: session.userId }, include: { business: true } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * On the login page a finished account (business set up, trial or paid up) goes
 * straight to its dashboard. The signup page always shows its form, so anyone
 * signed in there is signed out first, as is an unfinished account on login.
 */
export async function redirectSignedInOwner(page: "/login" | "/signup") {
  const user = await getCurrentUser();
  if (!user) return;
  const subscription = await db.subscription.findUnique({ where: { userId: user.id } });
  if (page === "/login" && user.business && hasAccess(subscription)) redirect("/dashboard");
  redirect(`/api/auth/reset?next=${page}`);
}

/** A signed-in owner whose subscription is in its trial or paid up. */
export async function requireSubscribedUser() {
  const user = await requireUser();
  const subscription = await db.subscription.findUnique({ where: { userId: user.id } });
  if (!hasAccess(subscription)) redirect("/subscribe");
  return user;
}

/**
 * The signed-in owner's business. The tenant id always comes from the server
 * session, never from request input, so every query scoped by it is isolated.
 */
export async function requireBusiness() {
  const user = await requireSubscribedUser();
  if (!user.business) redirect("/onboarding");
  return user.business;
}
