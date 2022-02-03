const [, , ...args] = process.argv;

import { sourceDirs } from "./sourceDirs";
import { parseSourceIndex } from "./parseSourceIndex";
import { parcelOptions } from "./parcelOptions";
import { getContentFiles } from "./getContentFiles";
import { createStaticFiles } from "./createStaticFiles";
import { log, error } from "./console";
import { clearDirectory } from "./clearDirectory";

import { existsSync } from "fs";
import { Parcel } from "@parcel/core";

// Get directories and index file
const dirs = sourceDirs(args);
if (!existsSync(dirs.sourceIndex)) {
  error(`"${dirs.sourceIndex}" does not exist`);
  process.exit(1);
}

if (existsSync(dirs.distDir)) {
  log(`clearing "${dirs.distDir}"…`);
  clearDirectory(dirs.distDir);
}

// Get options from router attributes
const routerOptions = parseSourceIndex(dirs);

// Get all content files
const contentFiles = getContentFiles(routerOptions.contentDir);

log(`building "${dirs.sourceIndex}"…`);
const bundler = new Parcel(parcelOptions(dirs, contentFiles));
bundler.run().then((ev) => {
  if (ev.type !== "buildSuccess") {
    error(ev);
    process.exit(1);
  }

  log(`📦 Parcel build completed in ${ev.buildTime}ms`);

  createStaticFiles(dirs, routerOptions, contentFiles);
});
