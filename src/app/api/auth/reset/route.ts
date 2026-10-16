import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const ALLOWED = new Set(["/login", "/signup"]);

/** Signs out an account that never finished signing up and returns to the login or signup form. */
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next") ?? "/login";
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL(ALLOWED.has(next) ? next : "/login", req.url));
}
