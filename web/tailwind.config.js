/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: "var(--navy)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        edge: "var(--edge)",
        surface: "var(--surface)",
        amber: {
          DEFAULT: "var(--orange)",
          dark: "var(--orange-dark)",
          soft: "var(--orange-soft)",
        },
        green: {
          DEFAULT: "var(--green)",
          dark: "var(--green-dark)",
          soft: "var(--green-soft)",
        },
        blue: {
          DEFAULT: "var(--blue)",
          light: "var(--blue-light)",
        },
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ['"Source Sans 3"', "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
      },
    },
  },
  plugins: [],
};
