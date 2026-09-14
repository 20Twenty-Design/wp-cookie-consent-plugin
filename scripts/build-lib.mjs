// Builds the npm package into dist/.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
execFileSync(process.execPath, [join(root, "node_modules/tsup/dist/cli-default.js"), "--config", "tsup.config.ts"], {
  cwd: root,
  stdio: "inherit",
});
mkdirSync(dist, { recursive: true });
copyFileSync(join(root, "src/styles/consent.css"), join(dist, "styles.css"));
