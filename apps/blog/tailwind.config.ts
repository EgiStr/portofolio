import type { Config } from "tailwindcss";
import sharedConfig from "@ecosystem/tailwind-config";
import typography from "@tailwindcss/typography";

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      typography: {
        DEFAULT: {
          css: {
            color: "hsl(var(--foreground))",
            a: {
              color: "hsl(var(--primary))",
              "&:hover": {
                color: "hsl(var(--primary) / 0.8)",
              },
            },
            "h1,h2,h3,h4,h5,h6": {
              color: "hsl(var(--foreground))",
            },
            code: {
              color: "hsl(var(--primary))",
              backgroundColor: "hsl(var(--secondary))",
              borderRadius: "0.25rem",
              padding: "0.125rem 0.25rem",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            blockquote: {
              borderLeftColor: "hsl(var(--primary))",
              color: "hsl(var(--muted-foreground))",
            },
            hr: {
              borderColor: "hsl(var(--border))",
            },
            strong: {
              color: "hsl(var(--foreground))",
            },
          },
        },
      },
    },
  },
  plugins: [...((sharedConfig.plugins as Array<any>) || []), typography as any],
};

export default config;
