// Zips the WordPress plugin into build/20twenty-cookie-consent.zip — the exact
// asset name the plugin's GitHub updater looks for on a release.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { root } from "./versions.mjs";

const slug = "20twenty-cookie-consent";
const pluginParent = join(root, "plugin");
const buildDir = join(root, "build");
const zip = join(buildDir, `${slug}.zip`);

for (const asset of ["cookie-consent.js", "consent-default.js", "cookie-consent.css"]) {
  if (!existsSync(join(pluginParent, slug, "assets/dist", asset))) {
    console.error(`Missing assets/dist/${asset} — run \`npm run build\` first.`);
    process.exit(1);
  }
}

mkdirSync(buildDir, { recursive: true });
rmSync(zip, { force: true });
execFileSync("zip", ["-rq", zip, slug, "-x", "*.DS_Store", "-x", "*/.git*"], {
  cwd: pluginParent,
  stdio: "inherit",
});
console.log(`Created ${zip}`);
