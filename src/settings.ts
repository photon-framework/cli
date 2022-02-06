import { log } from "./console.js";

export const settings = {
  noCache: process.argv.includes("--no-cache"),
  clean: process.argv.includes("--clean"),
  sourceMaps: process.argv.includes("--source-maps"),
  contentHash: !process.argv.includes("--no-content-hash"),
};

if (settings.contentHash) {
  log("⚙️", "Content hash enabled");
} else {
  log("⚙️", "Content hash disabled");
}

if (settings.clean) {
  log("⚙️", "Clean build enabled");
} else {
  log("⚙️", "Clean build disabled");
}

if (settings.noCache) {
  log("⚙️", "Cache disabled");
} else {
  log("⚙️", "Cache enabled");
}

if (settings.sourceMaps) {
  log("⚙️", "Source maps enabled");
} else {
  log("⚙️", "Source maps disabled");
}
