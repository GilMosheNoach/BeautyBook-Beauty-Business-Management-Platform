import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="h1 mt-4">הדף לא נמצא</h1>
      <p className="muted mt-2">ייתכן שהקישור שגוי או שהדף הוסר.</p>
      <Link href="/" className="btn-primary mt-6">לדף הבית</Link>
    </main>
  );
}
