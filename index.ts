const [, , ...args] = process.argv;

import { sourceDirs } from "./src/sourceDirs.js";
import { parseSourceIndex } from "./src/parseSourceIndex.js";
import { parcelOptions } from "./src/parcelOptions.js";
import { getContentFiles } from "./src/getContentFiles.js";
import { createStaticFiles } from "./src/createStaticFiles.js";
import { log, error } from "./src/console.js";
import { clearDirectory } from "./src/clearDirectory.js";
import { Parcel } from "@parcel/core";
import { existsSync } from "fs";

// Get directories and index file
const dirs = sourceDirs(args);
if (!existsSync(dirs.sourceIndex)) {
  error(`"${dirs.sourceIndex}" does not exist`);
  process.exit(1);
}

if (existsSync(dirs.distDir)) {
  log(`clearing "${dirs.distDir}"...`);
  clearDirectory(dirs.distDir);
}

if (existsSync(dirs.cacheDir)) {
  log(`clearing "${dirs.cacheDir}"...`);
  clearDirectory(dirs.cacheDir);
}

// Get options from router attributes
const routerOptions = parseSourceIndex(dirs);

// Get all content files
const contentFiles = getContentFiles(routerOptions.contentDir);

log(`building "${dirs.sourceIndex}"...`);
const bundler = new Parcel(parcelOptions(dirs, contentFiles));
bundler
  .run()
  .then((ev) => {
    if (ev.type !== "buildSuccess") {
      error(ev);
      process.exit(1);
    }

    log(`📦 Parcel build completed in ${ev.buildTime}ms`);

    createStaticFiles(dirs, routerOptions, contentFiles);
  })
  .catch((err) => {
    error("Parcel build failed", err);
    process.exit(1);
  });
