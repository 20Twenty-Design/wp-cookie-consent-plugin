// Prints the CHANGELOG.md section for a version (used as GitHub release notes,
// which the WordPress "View details" modal shows as the changelog).
// Usage: node scripts/release-notes.mjs 1.2.3
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./versions.mjs";

const version = (process.argv[2] || "").replace(/^v/, "");
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const escaped = version.replace(/\./g, "\\.");
const match = changelog.match(new RegExp(`^## \\[?${escaped}\\]?[^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"));

process.stdout.write(match ? match[1].trim() + "\n" : "");
