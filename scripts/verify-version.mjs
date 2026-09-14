// CI guard: the git tag, package.json and every plugin version marker must match.
// Usage: node scripts/verify-version.mjs 1.2.3
import { relative } from "node:path";
import { packageVersion, readVersions, root } from "./versions.mjs";

const expected = (process.argv[2] || packageVersion()).replace(/^v/, "");
const found = [{ file: "package.json", version: packageVersion() }, ...readVersions()];
const mismatched = found.filter((f) => f.version !== expected);

if (mismatched.length) {
  console.error(`Version mismatch — expected ${expected}:`);
  for (const f of mismatched) console.error(`  ${relative(root, f.file) || f.file}: ${f.version}`);
  console.error("Run `npm version <x.y.z>` (it syncs the plugin files) instead of editing by hand.");
  process.exit(1);
}
console.log(`All versions are ${expected}`);
