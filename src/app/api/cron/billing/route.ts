import { NextResponse } from "next/server";
import { runBillingCycle } from "@/server/billing";

/** Daily job: charges subscriptions whose trial or month ended. Call with `Authorization: Bearer $CRON_SECRET`. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await runBillingCycle());
}

export const GET = POST;
