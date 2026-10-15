"use client";

import { cancelSubscriptionAction } from "@/server/actions/billing";
import { SubmitButton } from "@/components/SubmitButton";

export function CancelSubscription({ until }: { until: string }) {
  return (
    <form
      action={cancelSubscriptionAction}
      onSubmit={(e) => {
        if (!window.confirm(`לבטל את המנוי? הדף שלך ימשיך לעבוד עד ${until} ולא יהיו חיובים נוספים.`)) e.preventDefault();
      }}
    >
      <SubmitButton className="btn-danger" pendingText="מבטלת…">ביטול מנוי</SubmitButton>
    </form>
  );
}
