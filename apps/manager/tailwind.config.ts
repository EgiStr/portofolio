import type { Config } from "tailwindcss";
import sharedConfig from "@ecosystem/tailwind-config";

const shared = sharedConfig.theme?.extend ?? {};

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...shared,
      colors: {
        ...(shared.colors as Record<string, unknown>),
        sidebar: "hsl(var(--sidebar))",
        "primary-soft": "hsl(var(--primary-soft))",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
