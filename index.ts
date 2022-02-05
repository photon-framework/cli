const [, , ...args] = process.argv;

import { sourceDirs } from "./src/sourceDirs.js";
import { parseSourceIndex } from "./src/parseSourceIndex.js";
import { parcelOptions } from "./src/parcelOptions.js";
import { getContentFiles as findContentFilesInSource } from "./src/getContentFiles.js";
import { createStaticFiles } from "./src/createStaticFiles.js";
import { log, error } from "./src/console.js";
import { clearDirectory } from "./src/clearDirectory.js";
import { getTemplateFiles as findTemplatesInContentFiles } from "./src/getTemplateFiles.js";
import { getDOM } from "./src/fileWrapper.js";
import { Parcel } from "@parcel/core";
import { existsSync } from "fs";

try {
  // Get directories and index file
  const dirs = sourceDirs(args);
  if (!existsSync(dirs.sourceIndex)) {
    error(`"${dirs.sourceIndex}" does not exist`);
  }

  if (existsSync(dirs.distDir)) {
    log(`clearing "${dirs.distDir}"...`);
    clearDirectory(dirs.distDir);
  }

  // Get options from router attributes
  const sourceDom = getDOM(dirs.sourceIndex);
  const routerOptions = parseSourceIndex(sourceDom, dirs);

  // Get all content and template files to transpile them
  const contentFiles = findContentFilesInSource(routerOptions.contentDir);
  const templateFiles = findTemplatesInContentFiles(
    sourceDom,
    dirs,
    contentFiles
  );

  log(`building "${dirs.sourceIndex}"...`);
  new Parcel(parcelOptions(dirs, contentFiles, templateFiles))
    .run()
    .then((ev) => {
      if (ev.type !== "buildSuccess") {
        error(ev);
      }

      log(`📦 Parcel build completed in ${ev.buildTime}ms`);

      createStaticFiles(dirs, routerOptions, contentFiles);
    })
    .catch((err) => {
      error("Parcel build failed", err);
    });
} catch (err) {
  error(err);
}
