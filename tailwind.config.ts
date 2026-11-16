import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0d1020", soft: "#3b4056", mute: "#6b7189" },
        mist: { DEFAULT: "#eef0fb", deep: "#dfe3f6" },
        line: "#e3e6f2",
        mint: { DEFAULT: "#2dd4a7", deep: "#0f9d78" },
        danger: "#d6385a",
        warn: "#d98a0b",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(13,16,32,.05), 0 8px 24px -12px rgba(13,16,32,.12)" },
    },
  },
  plugins: [],
};
export default config;
