"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/Icons";

export function Gallery({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + ids.length) % ids.length)), [ids.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      // Right-to-left: the right arrow goes back.
      if (e.key === "ArrowRight") step(-1);
      if (e.key === "ArrowLeft") step(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  // Swipe on phones. In RTL the next photo comes in from the left, so dragging right moves forward.
  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) step(dx > 0 ? 1 : -1);
  };

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {ids.map((id, i) => (
          <button key={id} type="button" onClick={() => setOpen(i)} className="group relative aspect-square cursor-zoom-in overflow-hidden bg-sand" aria-label={`הגדלת תמונה ${i + 1} מתוך ${ids.length}`}>
            <Image src={`/img/${id}`} alt="" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
            <span aria-hidden className="absolute inset-0 bg-stone-950/0 transition duration-500 group-hover:bg-stone-950/15" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="גלריה"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/[0.97] backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
          onClick={() => setOpen(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative h-[88svh] w-[92vw] max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image key={ids[open]} src={`/img/${ids[open]}`} alt={`תמונה ${open + 1} מתוך ${ids.length}`} fill sizes="92vw" priority className="object-contain" />
          </div>
          <button type="button" onClick={() => setOpen(null)} className="absolute end-4 top-4 p-2 text-ivory/80 transition hover:text-ivory" aria-label="סגירה">
            <CloseIcon size={28} />
          </button>
          {ids.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute start-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory transition hover:bg-ivory hover:text-stone-900 sm:start-6 sm:h-14 sm:w-14"
                aria-label="התמונה הקודמת"
              >
                <ChevronRightIcon size={26} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute end-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ivory/30 text-ivory transition hover:bg-ivory hover:text-stone-900 sm:end-6 sm:h-14 sm:w-14"
                aria-label="התמונה הבאה"
              >
                <ChevronLeftIcon size={26} />
              </button>
            </>
          )}
          <p dir="ltr" className="absolute bottom-4 text-xs tracking-[0.3em] text-ivory/70">{open + 1} / {ids.length}</p>
        </div>
      )}
    </>
  );
}
