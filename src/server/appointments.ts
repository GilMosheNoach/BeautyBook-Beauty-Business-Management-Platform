import { Prisma, type AppointmentSource, type AppointmentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { newToken } from "@/lib/tokens";

export class SlotTakenError extends Error {
  constructor() {
    super("SLOT_TAKEN");
  }
}

function isOverlapViolation(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes("Appointment_no_overlap") || message.includes("23P01");
}

type Tx = Prisma.TransactionClient;

/** Finds the business's client by phone, creating or renaming as needed. */
export async function upsertClient(tx: Tx, businessId: string, name: string, phone: string) {
  const normalized = normalizePhone(phone);
  return tx.client.upsert({
    where: { businessId_phone: { businessId, phone: normalized } },
    create: { businessId, name: name.trim(), phone: normalized },
    update: {},
  });
}

export type CreateAppointmentInput = {
  businessId: string;
  serviceId: string;
  startsAt: Date;
  clientId?: string;
  client?: { name: string; phone: string };
  status: AppointmentStatus;
  source: AppointmentSource;
  note?: string;
  durationMin?: number; // override service duration (manual bookings)
};

/**
 * Creates an appointment. The service must belong to the business, and the
 * database exclusion constraint rejects overlaps with active appointments,
 * which turns into SlotTakenError.
 */
export async function createAppointment(input: CreateAppointmentInput) {
  try {
    return await db.$transaction(async (tx) => {
      const service = await tx.service.findFirst({ where: { id: input.serviceId, businessId: input.businessId } });
      if (!service) throw new Error("SERVICE_NOT_FOUND");

      let clientId = input.clientId;
      if (clientId) {
        const owned = await tx.client.findFirst({ where: { id: clientId, businessId: input.businessId } });
        if (!owned) throw new Error("CLIENT_NOT_FOUND");
      } else if (input.client) {
        clientId = (await upsertClient(tx, input.businessId, input.client.name, input.client.phone)).id;
      } else {
        throw new Error("CLIENT_REQUIRED");
      }

      const duration = input.durationMin ?? service.durationMin;
      const endsAt = new Date(input.startsAt.getTime() + duration * 60_000);
      const timeOff = await tx.timeOff.findFirst({
        where: { businessId: input.businessId, startsAt: { lt: endsAt }, endsAt: { gt: input.startsAt } },
      });
      if (timeOff && input.source !== "MANUAL") throw new SlotTakenError();

      return tx.appointment.create({
        data: {
          businessId: input.businessId,
          clientId,
          serviceId: service.id,
          serviceName: service.name,
          priceAgorot: service.priceAgorot,
          startsAt: input.startsAt,
          endsAt,
          status: input.status,
          source: input.source,
          note: input.note?.trim() ?? "",
          manageToken: newToken(),
        },
      });
    });
  } catch (err) {
    if (isOverlapViolation(err)) throw new SlotTakenError();
    throw err;
  }
}

/** Status change scoped to the business; returns false if not found. */
export async function setAppointmentStatus(businessId: string, id: string, status: AppointmentStatus) {
  try {
    const res = await db.appointment.updateMany({ where: { id, businessId }, data: { status } });
    return res.count > 0;
  } catch (err) {
    // Re-activating a cancelled appointment whose slot was since taken.
    if (isOverlapViolation(err)) throw new SlotTakenError();
    throw err;
  }
}
