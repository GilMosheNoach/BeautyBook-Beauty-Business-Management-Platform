# BeautyBook

פלטפורמה מרובת עסקים לקוסמטיקאיות: דף הזמנת תורים אישי לכל עסק, הזמנה כאורחת (שם + טלפון), יומן לבעלת העסק עם אישור/דחיית בקשות, תורים ידניים, ניהול לקוחות, שירותים, מחירים, זמינות וקישורי הזמנה אישיים לשליחה בוואטסאפ/SMS.

התוכנית המלאה: [docs/PLAN.md](docs/PLAN.md).

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Prisma 5 · PostgreSQL 16 · Tailwind CSS · iron-session · argon2 · Vitest. ממשק עברי RTL, mobile-first.

## הרצה מקומית

**דרישות:** Node.js 20 ומעלה, ו-Docker Desktop פועל (בשביל PostgreSQL).

```bash
git clone https://github.com/AmnonHalili/BeautyBook.git
cd BeautyBook
npm install
npm run setup     # יוצר .env עם סוד אקראי, מרים Postgres ב-Docker, מריץ מיגרציות וטוען נתוני דמו
npm run dev       # http://localhost:3000
```

אחרי זה:

- **דף הזמנות לדוגמה:** http://localhost:3000/b/demo
- **כניסה לדשבורד של הדמו:** http://localhost:3000/login עם `demo@beautybook.co.il` / `demo1234`
- **עסק חדש משלך:** http://localhost:3000/signup

`npm run setup` מריץ את השלבים האלה, ואפשר גם להריץ אותם אחד אחד:

```bash
npm run setup:env          # מעתיק את .env.example ל-.env ומייצר SESSION_SECRET
npm run db:up              # docker compose up -d --wait postgres
npx prisma migrate deploy  # טבלאות + אילוץ מניעת כפל הזמנות
npm run db:seed            # עסק הדמו
```

**פורט 5432 תפוס?** (למשל כש-Postgres של BarberManager רץ) הוסיפו ל-.env את `POSTGRES_PORT=5433`, עדכנו את הפורט ב-`DATABASE_URL` לאותו מספר, והריצו `npm run setup` שוב.

**בלי Docker?** אפשר להשתמש בכל PostgreSQL 14 ומעלה: צרו מסד בשם `beautybook`, עדכנו את `DATABASE_URL` ב-.env, ודלגו על `npm run db:up`.

לעצירת מסד הנתונים: `npm run db:down` (הנתונים נשמרים ב-volume).

## בדיקות

```bash
npm run typecheck && npm run lint && npm test
```

בדיקות האינטגרציה רצות מול מסד `beautybook_test`, שנוצר אוטומטית בקונטיינר של Docker (או מול `TEST_DATABASE_URL`), ובודקות בידוד בין עסקים ומניעת כפל הזמנות במקביל.

## מבנה

| נתיב | מה יש שם |
|---|---|
| `src/app/b/[slug]` | דף ההזמנות הציבורי ודף ניהול התור של הלקוחה |
| `src/app/dashboard` | יומן, תורים, לקוחות, הזמנות, שירותים, זמינות, הגדרות |
| `src/app/api/public/[slug]/availability` | שעות פנויות לפי שירות וטווח ימים |
| `src/server/actions` | Server Actions (כל פעולה של בעלת עסק עוברת דרך `requireBusiness()`) |
| `src/server/appointments.ts` | יצירת תורים ושינוי סטטוס, מוגבל לעסק |
| `src/lib/slots.ts` | חישוב שעות פנויות (שעות עבודה, חסימות, תורים, מרווח, התראה מינימלית) |

## בידוד בין עסקים

ה-`businessId` נלקח תמיד מהסשן בצד השרת ולעולם לא מהדפדפן, וכל קריאה/עדכון/מחיקה מסוננים לפיו (`where: { id, businessId }`).

## מניעת כפל הזמנות

אילוץ `EXCLUDE USING gist` ב-Postgres (`Appointment_no_overlap`) אוסר חפיפה בין תורים פעילים (ממתין/מאושר) של אותו עסק, כך ששתי הזמנות מקבילות לאותה שעה לא יכולות להצליח שתיהן.

## פריסה

מתאים ל-Vercel + Postgres מנוהל (Neon / Supabase). הגדירו `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, והריצו `npx prisma migrate deploy` לפני העלאה. ה-rate limit להזמנות ציבוריות הוא בזיכרון; כשיש כמה מופעים כדאי להעביר אותו ל-Redis/Upstash.
