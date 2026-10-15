import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LegalLinks } from "@/components/LegalFooter";
import { getCurrentUser } from "@/lib/session";
import { JsonLd } from "@/components/JsonLd";
import { appUrl, businessUrl } from "@/lib/url";

export const metadata = { alternates: { canonical: "/" } };

const FEATURES = [
  { title: "דף הזמנות אישי", text: "קישור משלך לשליחה ללקוחות, לביו באינסטגרם ולסטורי." },
  { title: "יומן חכם", text: "תצוגת יום ושבוע, אישור בקשות בלחיצה וקביעת תורים ידנית." },
  { title: "שירותים ומחירים", text: "את קובעת מה מציעים, כמה זמן זה לוקח וכמה זה עולה." },
  { title: "זמינות בשליטה שלך", text: "שעות עבודה, הפסקות, חופשות. רק שעות פנויות מוצגות ללקוחות." },
  { title: "הזמנות ללקוחות", text: "שולחים קישור אישי בוואטסאפ, הלקוחה בוחרת מועד בעצמה." },
  { title: "כרטיס לקוחה", text: "היסטוריית טיפולים, הערות ורגישויות במקום אחד." },
];

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-stone-50">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "WebSite", name: "BeautyBook", url: appUrl("/"), inLanguage: "he-IL" },
            {
              "@type": "SoftwareApplication",
              name: "BeautyBook",
              url: appUrl("/"),
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "מערכת לניהול תורים לקוסמטיקאיות: דף הזמנות אישי, יומן וניהול לקוחות.",
            },
          ],
        }}
      />
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-stone-200 px-4 py-5">
        <Logo />
        <nav className="flex gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary btn-sm">ללוח הבקרה</Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary btn-sm">כניסה</Link>
              <Link href="/signup" className="btn-primary btn-sm">הרשמה</Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-20 text-center sm:py-28">
          <p className="eyebrow">לקוסמטיקאיות ובעלות עסקי יופי</p>
          <h1 className="mt-5 font-serif text-5xl font-light leading-[1.1] tracking-tight sm:text-7xl">
            התורים של העסק שלך,
            <br />
            <span className="text-brand-600">בקישור אחד.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
            BeautyBook היא הפלטפורמה לקוסמטיקאיות ובעלות עסקי יופי: דף הזמנות אישי, יומן לניהול לוח הזמנים וניהול לקוחות. בלי אפליקציה ובלי הרשמה ללקוחות.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={user ? "/dashboard" : "/signup"} className="btn-primary px-7 py-3 text-base">מתחילות בחינם</Link>
            <a href={businessUrl("demo")} className="btn-secondary px-7 py-3 text-base">לדף לדוגמה</a>
          </div>
        </section>
        <section className="grid gap-px border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="bg-stone-50 p-7">
              <p className="font-display text-2xl lining-nums text-brand-600">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-serif text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.text}</p>
            </div>
          ))}
        </section>
        <div className="h-20" />
      </main>
      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-600">
        <Link href="/beauticians" className="hover:text-stone-900">קוסמטיקאיות · קביעת תור אונליין</Link>
        <LegalLinks className="mt-4 text-stone-500" />
      </footer>
    </div>
  );
}
