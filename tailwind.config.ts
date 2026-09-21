import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Haven palette: deep navy, muted teal, warm neutral, off-white.
        navy: {
          50: "#eef1f6",
          100: "#d3dbe8",
          200: "#a7b6d0",
          300: "#7b91b8",
          400: "#4f6da0",
          500: "#2f4c7e",
          600: "#243c64",
          700: "#1b2d4b",
          800: "#132038",
          900: "#0c1626",
          950: "#070d17",
        },
        teal: {
          50: "#edf7f6",
          100: "#cfeae7",
          200: "#a1d6d0",
          300: "#6fbdb5",
          400: "#469f97",
          500: "#2f827b",
          600: "#256962",
          700: "#20544f",
          800: "#1c4340",
          900: "#173634",
        },
        sand: {
          50: "#faf8f4",
          100: "#f2ede3",
          200: "#e6dcc9",
          300: "#d6c6a8",
          400: "#c2ab82",
        },
        // Severity colours (paired always with label/icon/text — never colour alone).
        sev: {
          low: "#2f827b",
          moderate: "#b07d20",
          high: "#c05a1e",
          critical: "#a3232b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
