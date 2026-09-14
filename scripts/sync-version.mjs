// Runs from the npm `version` lifecycle: copies package.json's new version
// into the plugin header, TWCC_VERSION and readme.txt before npm commits + tags.
import { packageVersion, writeVersion } from "./versions.mjs";

const version = packageVersion();
writeVersion(version);
console.log(`Synced plugin version to ${version}`);
