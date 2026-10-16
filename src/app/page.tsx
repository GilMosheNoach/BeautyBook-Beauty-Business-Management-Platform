import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
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

// Drop a landscape photo at public/hero.jpg to fill the hero; without one it falls back to a plain black field.
const HERO_PHOTO = existsSync(path.join(process.cwd(), "public", "hero.jpg")) ? "/hero.jpg" : null;

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
      <header className="relative flex h-svh min-h-[600px] flex-col overflow-hidden bg-stone-900 text-ivory">
        {HERO_PHOTO && (
          <>
            <Image src={HERO_PHOTO} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-stone-950/45" />
          </>
        )}
        <nav className="relative z-10 flex items-center justify-between gap-4 border-b border-ivory/15 px-5 py-4 sm:px-10">
          <Logo light />
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="btn bg-ivory px-4 py-2 text-sm text-stone-900 hover:bg-white">ללוח הבקרה</Link>
            ) : (
              <>
                <Link href="/login" className="btn border border-ivory/70 px-4 py-2 text-sm text-ivory hover:bg-ivory hover:text-stone-900">כניסה</Link>
                <Link href="/signup" className="btn bg-ivory px-4 py-2 text-sm text-stone-900 hover:bg-white">הרשמה</Link>
              </>
            )}
          </div>
        </nav>
        <div className="relative mx-auto mt-auto w-full max-w-6xl px-6 pb-20 sm:px-10 sm:pb-24">
          <p className="text-xs tracking-[0.3em] text-ivory/80">לקוסמטיקאיות ובעלות עסקי יופי</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-extralight leading-[1.05] sm:text-8xl">
            התורים של העסק שלך,
            <br />
            בקישור אחד.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-ivory/90">
            דף הזמנות אישי, יומן לניהול לוח הזמנים וניהול לקוחות. בלי אפליקציה ובלי הרשמה ללקוחות.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={user ? "/dashboard" : "/signup"} className="btn bg-ivory px-8 py-3.5 tracking-[0.12em] text-stone-900 hover:bg-white">מתחילות בחינם</Link>
            <a href={businessUrl("demo")} className="btn border border-ivory/70 px-8 py-3.5 tracking-[0.12em] text-ivory hover:bg-ivory hover:text-stone-900">לדף לדוגמה</a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <div className="py-16 text-center sm:py-20">
          <p className="eyebrow">מה מקבלים</p>
          <h2 className="mt-2 font-serif text-3xl font-extralight sm:text-4xl">כל מה שהעסק צריך, במקום אחד</h2>
        </div>
        <section className="grid gap-px border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="bg-stone-50 p-7">
              <p className="font-display text-2xl lining-nums text-brand-600">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 font-serif font-light text-xl">{f.title}</h3>
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
