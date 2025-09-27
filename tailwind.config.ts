import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4C51BF",
          foreground: "#FFFFFF"
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5f5",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a"
        }
      },
      borderRadius: {
        xl: "1rem"
      },
      boxShadow: {
        sheet: "0 -12px 32px rgba(15, 23, 42, 0.18)",
        modal: "0 20px 60px rgba(15, 23, 42, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
