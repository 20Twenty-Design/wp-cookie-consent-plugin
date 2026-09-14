// Builds the browser assets shipped inside the WordPress plugin.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "plugin/20twenty-cookie-consent/assets/dist");

rmSync(out, { recursive: true, force: true });
execFileSync(process.execPath, [join(root, "node_modules/tsup/dist/cli-default.js"), "--config", "tsup.wp.config.ts"], {
  cwd: root,
  stdio: "inherit",
});
mkdirSync(out, { recursive: true });
copyFileSync(join(root, "src/styles/consent.css"), join(out, "cookie-consent.css"));
