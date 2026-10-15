export function formatPrice(agorot: number) {
  const shekels = agorot / 100;
  return `₪${shekels.toLocaleString("he-IL", {
    minimumFractionDigits: Number.isInteger(shekels) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function shekelsToAgorot(value: string | number) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  return Math.round(n * 100);
}
