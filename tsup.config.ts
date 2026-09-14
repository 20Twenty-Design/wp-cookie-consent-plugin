import { defineConfig } from "tsup";
import type { Options } from "tsup";

// npm package build. Two configs because the React entry needs a
// "use client" banner and the others must not have one.
const shared: Options = {
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2019",
  clean: false, // scripts/build-lib.mjs wipes dist once before both run
  outDir: "dist",
  external: ["react", "react-dom", "next", /^next\//, /^@20twenty-design\/cookie-consent/],
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: "src/index.ts",
      vanilla: "src/vanilla/index.ts",
      "next/index": "src/next/index.ts",
      "next/server": "src/next/server.ts",
    },
  },
  {
    ...shared,
    entry: { "react/index": "src/react/index.ts" },
    banner: { js: '"use client";' },
  },
]);
