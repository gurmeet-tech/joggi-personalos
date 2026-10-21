import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--c-ink-soft) / <alpha-value>)",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        "canvas-soft": "rgb(var(--c-canvas-soft) / <alpha-value>)",
        field: "rgb(var(--c-field) / <alpha-value>)",
        hairline: "rgb(var(--c-hairline) / <alpha-value>)",
        "hairline-soft": "rgb(var(--c-hairline-soft) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "on-primary": "rgb(var(--c-on-primary) / <alpha-value>)",
      },
      borderRadius: {
        sm: "16px",
        md: "24px",
        full: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "80px",
        "section-lg": "120px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.0", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.05", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.15", fontWeight: "700" }],
        h3: ["19px", { lineHeight: "1.2", fontWeight: "700" }],
        h4: ["16px", { lineHeight: "1.25", fontWeight: "700" }],
        title: ["14px", { lineHeight: "1.3", fontWeight: "700" }],
        "body-lg": ["15px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["13px", { lineHeight: "1.45", fontWeight: "600" }],
        "body-sm": ["12px", { lineHeight: "1.45", fontWeight: "600" }],
        link: ["13px", { lineHeight: "1.4", fontWeight: "700" }],
        label: ["10px", { lineHeight: "1.33", fontWeight: "700" }],
        caption: ["10px", { lineHeight: "1.33", fontWeight: "600" }],
      },
      boxShadow: {
        none: "none",
        card: "0 1px 2px rgba(20, 20, 20, 0.04), 0 4px 12px rgba(20, 20, 20, 0.05)",
        overlay: "0 8px 32px rgba(20, 20, 20, 0.12)",
        toast: "0 4px 24px rgba(20, 20, 20, 0.10)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
