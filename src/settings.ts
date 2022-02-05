import { log, warn } from "./console.js";

export const settings = {
  noCache: process.argv.includes("--no-cache"),
  sourceMaps: process.argv.includes("--source-maps"),
  contentHash: !process.argv.includes("--no-content-hash"),
};

if (settings.contentHash) {
  log(`💻 Content hash enabled`);
} else {
  warn(`💻 Content hash disabled`);
}

if (settings.noCache) {
  warn(`💾 Cache disabled`);
} else {
  log(`🚀 Cache enabled`);
}

if (settings.sourceMaps) {
  log(`🗺 Source maps enabled`);
} else {
  log(`🗺 Source maps disabled`);
}
