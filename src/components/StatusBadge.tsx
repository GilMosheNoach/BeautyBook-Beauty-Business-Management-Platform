import type { AppointmentStatus } from "@prisma/client";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: "ממתין לאישור",
  CONFIRMED: "מאושר",
  REJECTED: "נדחה",
  CANCELLED: "בוטל",
  COMPLETED: "הושלם",
  NO_SHOW: "לא הגיעה",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  PENDING: "border border-[#b08a57] text-[#7a5a2e]",
  CONFIRMED: "bg-stone-900 text-ivory",
  REJECTED: "border border-stone-300 text-stone-500",
  CANCELLED: "border border-stone-300 text-stone-500",
  COMPLETED: "bg-stone-200 text-stone-700",
  NO_SHOW: "border border-red-300 text-red-800",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
