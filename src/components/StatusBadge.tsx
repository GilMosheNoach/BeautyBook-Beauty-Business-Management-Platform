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
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-stone-200 text-stone-700",
  COMPLETED: "bg-sky-100 text-sky-800",
  NO_SHOW: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
