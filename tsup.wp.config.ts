import { defineConfig } from "tsup";

// Browser bundles shipped inside the WordPress plugin. Self-contained IIFEs,
// no module loader, no dependencies.
export default defineConfig({
  entry: {
    "cookie-consent": "src/wp/index.ts",
    "consent-default": "src/wp/consent-default.ts",
  },
  format: ["iife"],
  outDir: "plugin/20twenty-cookie-consent/assets/dist",
  outExtension: () => ({ js: ".js" }),
  target: "es2017",
  minify: true,
  sourcemap: false,
  dts: false,
  clean: false,
  splitting: false,
});
