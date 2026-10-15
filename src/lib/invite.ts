import { appUrl } from "@/lib/url";

// One place that builds an invitation's link and the message sent with it, so
// a resend from the list reads exactly like the first send.
export function inviteLink(slug: string, token: string) {
  return appUrl(`/b/${slug}?invite=${token}`);
}

export function inviteText(opts: { link: string; businessName: string; clientName: string; serviceName?: string | null; message: string }) {
  const greeting = opts.clientName ? `היי ${opts.clientName}! ` : "היי! ";
  const body = opts.message || `מוזמנת לקבוע תור${opts.serviceName ? ` ל${opts.serviceName}` : ""} ב${opts.businessName}.`;
  return `${greeting}${body}\nלבחירת מועד: ${opts.link}`;
}
