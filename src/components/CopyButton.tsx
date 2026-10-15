"use client";

import { useState } from "react";

export function CopyButton({ text, label = "העתקת קישור", className = "btn-secondary" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("העתיקי את הקישור:", text);
        }
      }}
    >
      {copied ? "הועתק ✓" : label}
    </button>
  );
}
