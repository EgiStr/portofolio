import { defineConfig } from "tsup";

/**
 * Build config for @ecosystem/ui.
 *
 * Key choice: `bundle: false` so each source file is transpiled to its own
 * ESM file in `dist/`. This preserves React's `"use client"` / `"use server"`
 * directives on a per-file basis — bundling everything into one file would
 * strip them and break Next.js's RSC boundary detection.
 *
 * Every TS/TSX file under `src/` is its own entry so the barrel
 * (`src/index.ts`) can `export { … } from "./components/foo"` and Node
 * resolves to `dist/components/foo.js` at runtime.
 */
export default defineConfig({
  entry: ["src/**/*.{ts,tsx}"],
  format: ["esm"],
  dts: true,
  bundle: false,
  external: ["react", "react-dom", "react/jsx-runtime"],
  splitting: false,
  clean: true,
  target: "es2020",
  outExtension() {
    return { js: ".js" };
  },
});
