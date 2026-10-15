import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";

const FEATURES = [
  { icon: "🔗", title: "דף הזמנות אישי", text: "קישור משלך לשליחה ללקוחות, לביו באינסטגרם ולסטורי." },
  { icon: "📅", title: "יומן חכם", text: "תצוגת יום ושבוע, אישור בקשות בלחיצה וקביעת תורים ידנית." },
  { icon: "💅", title: "שירותים ומחירים", text: "את קובעת מה מציעים, כמה זמן זה לוקח וכמה זה עולה." },
  { icon: "🕘", title: "זמינות בשליטה שלך", text: "שעות עבודה, הפסקות, חופשות. רק שעות פנויות מוצגות ללקוחות." },
  { icon: "💌", title: "הזמנות ללקוחות", text: "שולחים קישור אישי בוואטסאפ, הלקוחה בוחרת מועד בעצמה." },
  { icon: "👩", title: "כרטיס לקוחה", text: "היסטוריית טיפולים, הערות ורגישויות במקום אחד." },
];

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex gap-2">
          {user ? (
            <Link href="/dashboard" className="btn-primary btn-sm">ליומן שלי</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-sm">התחברות</Link>
              <Link href="/signup" className="btn-primary btn-sm">הרשמה</Link>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            התורים של העסק שלך,
            <br />
            <span className="text-brand-600">בקישור אחד.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-600">
            BeautyBook היא הפלטפורמה לקוסמטיקאיות ובעלות עסקי יופי: דף הזמנות אישי, יומן לניהול לוח הזמנים וניהול לקוחות. בלי אפליקציה ובלי הרשמה ללקוחות.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={user ? "/dashboard" : "/signup"} className="btn-primary px-6 py-3 text-base">מתחילות בחינם</Link>
            <Link href="/b/demo" className="btn-secondary px-6 py-3 text-base">לדף לדוגמה</Link>
          </div>
        </section>
        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
