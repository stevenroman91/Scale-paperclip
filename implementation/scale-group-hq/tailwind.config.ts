import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          50: "#e8edf5",
          100: "#c5d1e8",
          200: "#9eb3d9",
          300: "#7795ca",
          400: "#597fbf",
          500: "#3b69b4",
          600: "#3561ad",
          700: "#2d56a4",
          800: "#264c9c",
          900: "#193b8c",
          950: "#0f2460",
        },
        navy: {
          50: "#e6e8f0",
          100: "#c0c5d9",
          200: "#969fc0",
          300: "#6c79a7",
          400: "#4d5c94",
          500: "#2d3f82",
          600: "#28397a",
          700: "#22316f",
          800: "#1c2965",
          900: "#111b52",
          950: "#0a1035",
        },
        accent: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196f3",
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
