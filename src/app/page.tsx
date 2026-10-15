import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";

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
            <Link href="/b/demo" className="btn-secondary px-7 py-3 text-base">לדף לדוגמה</Link>
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
    </div>
  );
}
