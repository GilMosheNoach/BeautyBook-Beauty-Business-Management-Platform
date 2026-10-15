import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      // Sharper corners for an editorial, boutique look.
      borderRadius: { lg: "3px", xl: "4px", "2xl": "6px" },
      colors: {
        // Deep bordeaux accent.
        brand: {
          50: "#f8f0ee",
          100: "#f0e0dc",
          200: "#e0c0b8",
          300: "#c9968a",
          400: "#a8685b",
          500: "#8a4339",
          600: "#6e2b2a",
          700: "#5a2322",
          800: "#481c1c",
          900: "#3a1717",
        },
        // Warm linen neutrals in place of Tailwind's grey stone, ending in espresso.
        stone: {
          50: "#f6f1eb",
          100: "#efe8df",
          200: "#e3d9cc",
          300: "#d2c4b4",
          400: "#ae9d8c",
          500: "#7f6e63",
          600: "#6a5a4f",
          700: "#4f4239",
          800: "#3a2f28",
          900: "#2a1f1a",
          950: "#1e1612",
        },
        ivory: "#fffdf9",
        sand: "#e8dccf",
        nude: "#ebd6cc",
      },
    },
  },
  plugins: [],
} satisfies Config;
