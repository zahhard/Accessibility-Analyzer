import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090B",
        surface: "#18181B",
        elevated: "#27272A",
        border: "#3F3F46",
        primary: "#8B5CF6",
      },
      fontFamily: { sans: ["var(--font-vazirmatn)", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
