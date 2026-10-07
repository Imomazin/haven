import type { Config } from "tailwindcss";

// Haven design system — a calm, architectural, public-service palette:
// midnight ink, warm terracotta, limestone, muted sage and graphite.
// Deliberately NOT the bright blue/purple SaaS aesthetic.

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#eef1f6",
          100: "#d8dfea",
          200: "#b2c0d4",
          300: "#839ab8",
          400: "#556c93",
          500: "#3a527a",
          600: "#2c4063",
          700: "#213250",
          800: "#172741",
          900: "#101d33",
          950: "#0a1324",
        },
        terracotta: {
          50: "#faf0ea",
          100: "#f3dccf",
          200: "#e7b79f",
          300: "#d9906c",
          400: "#cc7249",
          500: "#bb5a32",
          600: "#a0472a",
          700: "#803828",
          800: "#672f24",
          900: "#55291f",
        },
        limestone: {
          50: "#faf8f3",
          100: "#f4f0e7",
          200: "#eae3d5",
          300: "#dcd1bc",
          400: "#c7b79b",
        },
        sage: {
          50: "#eef3ee",
          100: "#d6e4d8",
          200: "#aecab2",
          300: "#80aa88",
          400: "#5c8868",
          500: "#456b50",
          600: "#365540",
          700: "#2b4434",
          800: "#23382b",
        },
        graphite: {
          50: "#f6f6f5",
          100: "#eaeae8",
          200: "#d6d6d3",
          300: "#b7b8b3",
          400: "#8f918b",
          500: "#6d6f69",
          600: "#555751",
          700: "#434540",
          800: "#2d2f2b",
          900: "#1b1c1a",
        },
        risk: {
          "critical-50": "#f8ebe8",
          "critical-100": "#f0d5cf",
          "critical-200": "#e0ada4",
          "critical-500": "#a1332a",
          "critical-700": "#7e2820",
          "critical-900": "#5f1d17",
          "high-50": "#f9ede4",
          "high-100": "#f2d7c4",
          "high-200": "#e6b193",
          "high-500": "#bf5a2c",
          "high-700": "#8f4120",
          "high-900": "#6d3119",
          "moderate-50": "#f7f0db",
          "moderate-100": "#ecdeb2",
          "moderate-200": "#ddc579",
          "moderate-500": "#8f6410",
          "moderate-700": "#6f4e0d",
          "moderate-900": "#523a0a",
          "low-50": "#eaf2ec",
          "low-100": "#cfe1d3",
          "low-200": "#a7c7ad",
          "low-500": "#3f6b4e",
          "low-700": "#30523c",
          "low-900": "#243f2d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16,29,51,0.05), 0 1px 3px rgba(16,29,51,0.04)",
        panel: "0 1px 0 rgba(16,29,51,0.04), 0 8px 24px -12px rgba(16,29,51,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
