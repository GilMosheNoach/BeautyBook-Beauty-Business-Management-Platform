import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-heebo)", "system-ui", "sans-serif"] },
      colors: {
        brand: {
          50: "#fdf2f6",
          100: "#fce7ef",
          200: "#f9cfe0",
          300: "#f4a8c5",
          400: "#ec74a0",
          500: "#e04a80",
          600: "#cc2d63",
          700: "#ab1f4d",
          800: "#8e1d42",
          900: "#771c3a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
