# BeautyBook

פלטפורמה מרובת עסקים לקוסמטיקאיות: דף הזמנת תורים אישי לכל עסק, הזמנה כאורחת (שם + טלפון), יומן לבעלת העסק עם אישור/דחיית בקשות, תורים ידניים, ניהול לקוחות, שירותים, מחירים, זמינות וקישורי הזמנה אישיים לשליחה בוואטסאפ/SMS.

התוכנית המלאה: [docs/PLAN.md](docs/PLAN.md).

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Prisma 5 · PostgreSQL 16 · Tailwind CSS · iron-session · argon2 · Vitest. ממשק עברי RTL, mobile-first.

## הרצה מקומית

**דרישות:** Node.js 20 ומעלה, ו-Docker Desktop פועל (בשביל PostgreSQL).

```bash
git clone https://github.com/GilMosheNoach/BeautyBook-Beauty-Business-Management-Platform.git BeautyBook
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
| `src/app/dashboard` | יומן, תורים, לקוחות, הזמנות, שירותים, זמינות, עיצוב הדף, הגדרות |
| `src/app/img/[id]` | הגשת התמונות שבעלת העסק העלתה (תמונה ראשית, טיפולים, גלריה, תמונת "עליי") |
| `src/server/images.ts` | העלאה, אימות סוג קובץ לפי התוכן, מחיקה וסידור הגלריה, מוגבל לעסק |
| `src/app/api/public/[slug]/availability` | שעות פנויות לפי שירות וטווח ימים |
| `src/server/actions` | Server Actions (כל פעולה של בעלת עסק עוברת דרך `requireBusiness()`) |
| `src/server/appointments.ts` | יצירת תורים ושינוי סטטוס, מוגבל לעסק |
| `src/lib/slots.ts` | חישוב שעות פנויות (שעות עבודה, חסימות, תורים, מרווח, התראה מינימלית) |

## בידוד בין עסקים

ה-`businessId` נלקח תמיד מהסשן בצד השרת ולעולם לא מהדפדפן, וכל קריאה/עדכון/מחיקה מסוננים לפיו (`where: { id, businessId }`).

## מניעת כפל הזמנות

אילוץ `EXCLUDE USING gist` ב-Postgres (`Appointment_no_overlap`) אוסר חפיפה בין תורים פעילים (ממתין/מאושר) של אותו עסק, כך ששתי הזמנות מקבילות לאותה שעה לא יכולות להצליח שתיהן.

## תמונות

התמונות נשמרות במסד הנתונים (טבלת `Image`), כך שאין צורך באחסון קבצים נפרד. הדפדפן מקטין כל תמונה ל-2000 פיקסלים לפני ההעלאה, השרת מקבל רק JPG/PNG/WEBP עד 4MB ובודק את סוג הקובץ לפי התוכן שלו. כל תמונה היא שורה שלא משתנה (החלפה יוצרת מזהה חדש), ולכן `/img/<id>` נשמר במטמון לתמיד. אם נפח התמונות יגדל מאוד, אפשר להעביר אותן לאחסון אובייקטים (S3 / R2) בלי לשנות את הדפים.

## כתובת לכל עסק ו-SEO

כל עסק מקבל כתובת משלו: `michal.beautybook.co.il`. ה-middleware (`src/middleware.ts`) מזהה את תת-הדומיין ומציג את דף העסק, ו-`/a/<token>` שם מציג את דף התור של הלקוחה. `/b/<slug>` ממשיך לעבוד, וכשמוגדר דומיין הוא מפנה (308) לתת-הדומיין כדי שלגוגל תהיה כתובת אחת לכל עסק.

- **הפעלה:** `NEXT_PUBLIC_ROOT_DOMAIN="beautybook.co.il"` ורשומת DNS כללית `*.beautybook.co.il` שמצביעה על השרת (ב-Vercel: להוסיף את הדומיין ואת `*.beautybook.co.il` לפרויקט). בלי המשתנה הקישורים נשארים `/b/<slug>`.
- **בדיקה מקומית:** `http://demo.localhost:3006` עובד גם בלי הגדרה (דפדפנים מפנים כל `*.localhost` למחשב עצמו).
- **מה גוגל מקבל:** כותרת ותיאור לכל עסק (שם + "קוסמטיקאית" + עיר), `canonical`, Open Graph, נתונים מובנים `BeautySalon` (כתובת, טלפון, שעות, טיפולים ומחירים), `sitemap.xml` עם כל העסקים, `robots.txt` שמסתיר את הדשבורד ודפי התורים, ודף `/beauticians` שמרכז את כל העסקים.
- **אחרי העלאה לאוויר:** לאמת את הדומיין ב-Google Search Console כ-Domain property (כך הוא מכסה את כל תתי-הדומיינים), לשים את קוד האימות ב-`GOOGLE_SITE_VERIFICATION`, ולהגיש את `https://beautybook.co.il/sitemap.xml`.

## מנוי, תשלום והפניות

- הרשמה ← דף תשלום (`/subscribe`) ← עמוד הסליקה ← הקמת העסק. בלי אמצעי תשלום שמור אין גישה לדשבורד.
- חודשיים ראשונים חינם, אחר כך ₪300 לחודש. החיוב נעשה ב-`runBillingCycle` (`src/server/billing.ts`), שרץ פעם ביום דרך `POST /api/cron/billing` עם `Authorization: Bearer $CRON_SECRET`.
- לכל בעלת עסק יש קישור הפניה (`/signup?ref=CODE`). על כל מופנית שכבר שילמה לפחות פעם אחת והמנוי שלה פעיל, המפנה מקבלת ₪100 הנחה בכל חיוב, עד מנוי חינם. ההנחה מחושבת מחדש בכל חיוב, כך שמופנית שביטלה או שהחיוב שלה נכשל מפסיקה להיחשב.
- ביטול מנוי משאיר גישה עד סוף התקופה ששולמה. חיוב שנכשל נותן 7 ימי חסד ונוסה שוב כל יום.
- `BILLING_PROVIDER="test"` מדמה את עמוד הסליקה (בלי פרטי כרטיס ובלי כסף), ומוסיף בדף המנוי כפתור "דילוג לחיוב הבא". חיבור לחברת סליקה אמיתית נעשה במימוש נוסף של `PaymentProvider` ב-`src/server/payments.ts`.

## פריסה

מתאים ל-Vercel + Postgres מנוהל (Neon / Supabase). הגדירו `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`, והריצו `npx prisma migrate deploy` לפני העלאה. ה-rate limit להזמנות ציבוריות הוא בזיכרון; כשיש כמה מופעים כדאי להעביר אותו ל-Redis/Upstash.
