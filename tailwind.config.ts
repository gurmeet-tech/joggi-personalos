import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        "ink-soft": "#262626",
        canvas: "#ffffff",
        "canvas-soft": "#f3f3f3",
        field: "#f0f0f0",
        hairline: "#e0e0e0",
        "hairline-soft": "#f0f0f0",
        muted: "#707070",
        faint: "#adadad",
        accent: "#0066ff",
        "on-primary": "#ffffff",
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
        display: ["80px", { lineHeight: "1.0", fontWeight: "650" }],
        h1: ["56px", { lineHeight: "1.0", fontWeight: "650" }],
        h2: ["44px", { lineHeight: "1.13", fontWeight: "650" }],
        h3: ["32px", { lineHeight: "1.13", fontWeight: "650" }],
        h4: ["24px", { lineHeight: "1.25", fontWeight: "650" }],
        title: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg": ["20px", { lineHeight: "1.38", fontWeight: "300" }],
        body: ["16px", { lineHeight: "1.38", fontWeight: "450" }],
        "body-sm": ["14px", { lineHeight: "1.43", fontWeight: "450" }],
        link: ["16px", { lineHeight: "1.38", fontWeight: "600" }],
        label: ["12px", { lineHeight: "1.33", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "1.33", fontWeight: "450" }],
      },
      boxShadow: {
        none: "none",
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
