export type FormState = { error?: string; ok?: string } | undefined;

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  }
  if (state?.ok) {
    return <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900">{state.ok}</p>;
  }
  return null;
}
