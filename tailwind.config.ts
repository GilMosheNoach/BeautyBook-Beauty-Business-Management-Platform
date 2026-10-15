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
        // Black accent: the brand is black on white.
        brand: {
          50: "#f5f5f5",
          100: "#ebebeb",
          200: "#d6d6d6",
          300: "#b3b3b3",
          400: "#7a7a7a",
          500: "#404040",
          600: "#111111",
          700: "#000000",
          800: "#000000",
          900: "#000000",
        },
        // Neutral greys in place of Tailwind's warm stone, ending in near-black.
        stone: {
          50: "#fafafa",
          100: "#f3f3f3",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#6f6f6f",
          600: "#575757",
          700: "#3d3d3d",
          800: "#262626",
          900: "#111111",
          950: "#0a0a0a",
        },
        ivory: "#ffffff",
        sand: "#ededed",
        nude: "#e2e2e2",
      },
    },
  },
  plugins: [],
} satisfies Config;
