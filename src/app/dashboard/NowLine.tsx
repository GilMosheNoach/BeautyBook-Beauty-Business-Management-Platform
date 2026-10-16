"use client";

import { useEffect, useState } from "react";

// Minutes since midnight in the business timezone.
function nowMinutes(tz: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

// Black line across today's column marking the current time; refreshes every 30 seconds.
export function NowLine({ tz, gridStart, gridEnd, pxPerMin }: { tz: string; gridStart: number; gridEnd: number; pxPerMin: number }) {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMinutes(nowMinutes(tz));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [tz]);

  if (minutes === null || minutes < gridStart || minutes > gridEnd) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
      style={{ top: (minutes - gridStart) * pxPerMin - 1 }}
      aria-hidden
    >
      <span className="-ms-1 h-2.5 w-2.5 shrink-0 rounded-full bg-stone-900" />
      <span className="h-0.5 flex-1 bg-stone-900" />
    </div>
  );
}
