export const STARTER_SERVICES = [
  { key: "facial", name: "טיפול פנים קלאסי", durationMin: 60, price: 250 },
  { key: "brows", name: "עיצוב גבות", durationMin: 20, price: 60 },
  { key: "manicure", name: "מניקור", durationMin: 45, price: 120 },
  { key: "gel", name: "לק ג׳ל", durationMin: 60, price: 150 },
  { key: "pedicure", name: "פדיקור", durationMin: 60, price: 160 },
  { key: "wax", name: "הסרת שיער בשעווה", durationMin: 30, price: 100 },
  { key: "lashes", name: "הרמת ריסים", durationMin: 60, price: 220 },
] as const;

// Sunday–Thursday 09:00–18:00, Friday 09:00–13:00.
export const DEFAULT_HOURS = [
  ...[0, 1, 2, 3, 4].map((weekday) => ({ weekday, startMin: 9 * 60, endMin: 18 * 60 })),
  { weekday: 5, startMin: 9 * 60, endMin: 13 * 60 },
];
