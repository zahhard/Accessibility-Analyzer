import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: { extend: { colors: { background: "#09090B", surface: "#18181B", elevated: "#27272A" } } },
  plugins: [],
} satisfies Config;
