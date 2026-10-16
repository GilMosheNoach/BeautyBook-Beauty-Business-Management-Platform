import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ipFromHeaders, rateLimit } from "@/lib/rateLimit";
import { isDateKey, localDateKey } from "@/lib/time";
import { availableDays } from "@/server/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`slots:${ipFromHeaders(req.headers)}`, 120, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const { slug } = await params;
  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const business = await db.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const service = await db.service.findFirst({ where: { id: serviceId, businessId: business.id, active: true } });
  if (!service) return NextResponse.json({ error: "service_not_found" }, { status: 404 });

  const fromParam = url.searchParams.get("from");
  const from = isDateKey(fromParam) ? fromParam : localDateKey(new Date(), business.timezone);
  const count = Math.min(Math.max(Number(url.searchParams.get("days")) || 14, 1), 31);
  const days = await availableDays(business, service.durationMin, from, count);
  return NextResponse.json(
    { timezone: business.timezone, days: days.map((d) => ({ date: d.date, slots: d.slots.map((s) => s.toISOString()), recommended: d.recommended.map((s) => s.toISOString()) })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
