import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { DEFAULT_HOURS } from "../src/lib/starterServices";

const db = new PrismaClient();
const TZ = "Asia/Jerusalem";

async function main() {
  const email = "demo@beautybook.co.il";
  await db.user.deleteMany({ where: { email } });

  const trialEnds = new Date();
  trialEnds.setMonth(trialEnds.getMonth() + 2);
  const user = await db.user.create({
    data: {
      email,
      name: "מיכל כהן",
      passwordHash: await hash(process.env.DEMO_PASSWORD || "demo1234"),
      subscription: {
        create: {
          status: "TRIALING",
          referralCode: "DEMO2026",
          trialEndsAt: trialEnds,
          currentPeriodEnd: trialEnds,
          provider: "test",
          customerRef: "test_ok_demo",
          cardLast4: "4242",
        },
      },
    },
  });
  const business = await db.business.create({
    data: {
      ownerId: user.id,
      slug: "demo",
      name: "סטודיו מיכל ליופי",
      tagline: "טיפולי פנים, גבות וציפורניים בסטודיו פרטי ושקט",
      bioTitle: "נעים להכיר, אני מיכל",
      bio: "אני קוסמטיקאית מוסמכת כבר יותר מעשר שנים. התחלתי בסלון קטן בתל אביב, ומאז למדתי טיפולי פנים מתקדמים, עיצוב גבות ובניית ציפורניים.\n\nבסטודיו שלי כל טיפול מתחיל בשיחה קצרה, כדי להבין מה העור שלך צריך באמת. אני מאמינה בטיפול שקט, אישי ומדויק, ובתוצאה שנראית טבעית.",
      about: "טיפולי פנים, גבות וציפורניים בסטודיו פרטי ונעים בתל אביב.",
      phone: "050-1234567",
      address: "דיזנגוף 100, תל אביב",
      instagram: "michal.beauty",
      onboarded: true,
      workingHours: { create: DEFAULT_HOURS },
      services: {
        create: [
          { name: "טיפול פנים קלאסי", durationMin: 60, priceAgorot: 25000, sortOrder: 0, description: "ניקוי עמוק, פילינג ומסכה מותאמת" },
          { name: "עיצוב גבות", durationMin: 20, priceAgorot: 6000, sortOrder: 1 },
          { name: "לק ג׳ל", durationMin: 60, priceAgorot: 15000, sortOrder: 2 },
          { name: "הרמת ריסים", durationMin: 60, priceAgorot: 22000, sortOrder: 3 },
        ],
      },
    },
    include: { services: true },
  });

  const clients = await Promise.all(
    [
      ["נועה לוי", "0521111111"],
      ["שירה מזרחי", "0542222222"],
      ["יעל אברהם", "0503333333"],
    ].map(([name, phone]) => db.client.create({ data: { businessId: business.id, name, phone } })),
  );

  // A few appointments over the next days, on working days only.
  const today = formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
  const plan = [
    { day: 1, hour: "10:00", s: 0, c: 0, status: "CONFIRMED" as const },
    { day: 1, hour: "12:00", s: 1, c: 1, status: "PENDING" as const },
    { day: 2, hour: "09:30", s: 2, c: 2, status: "CONFIRMED" as const },
    { day: 3, hour: "14:00", s: 3, c: 0, status: "PENDING" as const },
  ];
  for (const p of plan) {
    const [y, m, d] = today.split("-").map(Number);
    let key = new Date(Date.UTC(y, m - 1, d + p.day)).toISOString().slice(0, 10);
    while (new Date(key + "T12:00:00Z").getUTCDay() === 6) {
      key = new Date(new Date(key + "T12:00:00Z").getTime() + 86_400_000).toISOString().slice(0, 10);
    }
    const service = business.services[p.s];
    const startsAt = fromZonedTime(`${key}T${p.hour}:00`, TZ);
    await db.appointment
      .create({
        data: {
          businessId: business.id,
          clientId: clients[p.c].id,
          serviceId: service.id,
          serviceName: service.name,
          priceAgorot: service.priceAgorot,
          startsAt,
          endsAt: new Date(startsAt.getTime() + service.durationMin * 60_000),
          status: p.status,
          source: "ONLINE",
          manageToken: randomBytes(16).toString("base64url"),
        },
      })
      .catch(() => undefined); // skip if it collides with another seeded slot
  }
  console.log(`Seeded demo business: /b/demo  (login ${email} / ${process.env.DEMO_PASSWORD || "demo1234"})`);
}

main().finally(() => db.$disconnect());
