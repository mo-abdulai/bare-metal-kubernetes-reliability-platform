import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#090b10",
          900: "#0d1117",
          850: "#111722",
          800: "#161d29",
          700: "#243041",
        },
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 60px rgba(0,0,0,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
