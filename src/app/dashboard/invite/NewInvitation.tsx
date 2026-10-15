"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, PlusIcon } from "@/components/Icons";
import { InviteForm } from "./InviteForm";

type Props = {
  services: { id: string; name: string }[];
  defaults: { clientName: string; clientPhone: string };
  // Opened from a client's page (?clientId=…): start with the form showing.
  openOnLoad: boolean;
};

export function NewInvitation({ services, defaults, openOnLoad }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(openOnLoad);
  // Bumping the key remounts the form, clearing the previous result.
  const [round, setRound] = useState(0);
  const [prefill, setPrefill] = useState(defaults);
  const [fromClient, setFromClient] = useState(openOnLoad);

  const close = () => {
    setOpen(false);
    setRound((r) => r + 1);
    // The prefilled client only applies to the first invitation; drop it from the URL
    // too so a refresh doesn't reopen the form.
    setPrefill({ clientName: "", clientPhone: "" });
    if (fromClient) {
      setFromClient(false);
      router.replace("/dashboard/invite", { scroll: false });
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        <PlusIcon size={18} />
        הזמנה חדשה
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-invite-title" className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 sm:items-center sm:p-4" onClick={close}>
          <div className="max-h-[92svh] w-full overflow-y-auto rounded-t-2xl bg-ivory p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 id="new-invite-title" className="h2">הזמנה חדשה</h2>
              <button type="button" onClick={close} className="-m-2 p-2 text-stone-600 hover:text-stone-900" aria-label="סגירה">
                <CloseIcon size={22} />
              </button>
            </div>
            <p className="muted mb-4">יוצרים קישור אישי עם השם של הלקוחה ושולחים לה בוואטסאפ או SMS. היא בוחרת מועד בעצמה.</p>
            <InviteForm
              key={round}
              services={services}
              defaults={prefill}
              onAnother={() => {
                setPrefill({ clientName: "", clientPhone: "" });
                setRound((r) => r + 1);
              }}
              onClose={close}
            />
          </div>
        </div>
      )}
    </>
  );
}
