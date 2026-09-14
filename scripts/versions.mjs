// Every place the release version lives. One tag = one version everywhere.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = join(root, "plugin/20twenty-cookie-consent");

// Each pattern has exactly three groups: prefix, version, suffix.
export const targets = [
  {
    file: join(pluginDir, "20twenty-cookie-consent.php"),
    pattern: /^(\s*\*\s*Version:\s*)(\S+)()/m,
  },
  {
    file: join(pluginDir, "20twenty-cookie-consent.php"),
    pattern: /(define\(\s*'TWCC_VERSION',\s*')([^']+)(')/,
  },
  {
    file: join(pluginDir, "readme.txt"),
    pattern: /^(Stable tag:\s*)(\S+)()/m,
  },
];

export function packageVersion() {
  return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
}

export function readVersions() {
  return targets.map(({ file, pattern }) => {
    const match = readFileSync(file, "utf8").match(pattern);
    return { file, version: match ? match[2] : null };
  });
}

export function writeVersion(version) {
  for (const { file, pattern } of targets) {
    const source = readFileSync(file, "utf8");
    if (!pattern.test(source)) throw new Error(`Version marker not found in ${file}`);
    writeFileSync(file, source.replace(pattern, (_m, pre, _old, post) => `${pre}${version}${post}`));
  }
}
