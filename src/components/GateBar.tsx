import Link from "next/link";
import { logoutAction } from "@/server/actions/auth";
import { ChevronRightIcon } from "./Icons";
import { Logo } from "./Logo";

// Top bar for screens a signed-in owner must pass (payment, onboarding): a back arrow and a log-out button, so nobody gets stuck there.
export function GateBar({ back, backLabel = "חזרה" }: { back: string; backLabel?: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
      <Link href={back} className="btn-ghost btn-sm justify-self-start gap-1 px-2" aria-label={backLabel}>
        <ChevronRightIcon size={18} />
        <span className="text-sm">{backLabel}</span>
      </Link>
      <Logo />
      <form action={logoutAction} className="justify-self-end">
        <button className="btn-ghost btn-sm text-sm text-stone-600">התנתקות</button>
      </form>
    </div>
  );
}
