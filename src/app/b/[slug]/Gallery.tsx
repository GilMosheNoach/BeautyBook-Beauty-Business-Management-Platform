"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/Icons";

export function Gallery({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
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

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {ids.map((id, i) => (
          <button key={id} type="button" onClick={() => setOpen(i)} className="group relative aspect-square overflow-hidden bg-sand" aria-label={`תמונה ${i + 1} מתוך ${ids.length}`}>
            <Image src={`/img/${id}`} alt="" fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal="true" aria-label="גלריה" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95" onClick={() => setOpen(null)}>
          <div className="relative h-[85svh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={`/img/${ids[open]}`} alt="" fill sizes="100vw" className="object-contain" />
          </div>
          <button type="button" onClick={() => setOpen(null)} className="absolute end-4 top-4 p-2 text-ivory" aria-label="סגירה">
            <CloseIcon size={28} />
          </button>
          {ids.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute start-2 top-1/2 -translate-y-1/2 p-3 text-ivory" aria-label="הקודמת">
                <ChevronRightIcon size={32} />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute end-2 top-1/2 -translate-y-1/2 p-3 text-ivory" aria-label="הבאה">
                <ChevronLeftIcon size={32} />
              </button>
            </>
          )}
          <p dir="ltr" className="absolute bottom-4 text-xs tracking-[0.3em] text-ivory/70">{open + 1} / {ids.length}</p>
        </div>
      )}
    </>
  );
}
