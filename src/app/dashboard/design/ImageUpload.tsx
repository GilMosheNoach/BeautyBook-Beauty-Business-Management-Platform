"use client";

import { useRef, useState, useTransition } from "react";
import { uploadImageAction } from "@/server/actions/images";

const MAX_SIDE = 2000;

/** Shrinks a phone photo to at most 2000px on its long side, as JPEG, before upload. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85));
}

type Props = {
  kind: "cover" | "about" | "gallery" | "service";
  serviceId?: string;
  multiple?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function ImageUpload({ kind, serviceId, multiple, className = "btn-secondary btn-sm", children }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files);
    start(async () => {
      for (const [i, file] of list.entries()) {
        if (list.length > 1) setProgress(`${i + 1}/${list.length}`);
        let blob: Blob = file;
        try {
          blob = await shrink(file);
        } catch {
          // Formats the browser can't decode (e.g. some HEIC) go up as-is and the server decides.
        }
        const form = new FormData();
        form.set("kind", kind);
        if (serviceId) form.set("serviceId", serviceId);
        form.set("file", blob, "photo.jpg");
        const res = await uploadImageAction(form);
        if (res?.error) {
          setError(res.error);
          break;
        }
      }
      setProgress(null);
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button type="button" className={className} disabled={pending} onClick={() => input.current?.click()}>
        {pending ? `מעלה${progress ? ` ${progress}` : ""}…` : children}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="hidden" onChange={(e) => upload(e.target.files)} />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
