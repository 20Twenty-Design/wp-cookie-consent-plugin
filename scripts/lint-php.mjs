// `php -l` every PHP file in the plugin.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../plugin");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".php") ? [path] : [];
  });

let failed = false;
for (const file of walk(root)) {
  try {
    execFileSync("php", ["-l", file], { stdio: "pipe" });
  } catch (error) {
    failed = true;
    process.stderr.write(error.stdout?.toString() || error.message);
  }
}
if (failed) process.exit(1);
console.log("PHP lint OK");
