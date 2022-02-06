const [, , ...args] = process.argv;

import { sourceDirs } from "./src/sourceDirs";
import { parseSourceIndex } from "./src/parseSourceIndex";
import { parcelOptions } from "./src/parcelOptions";
import { findContentFilesInSource } from "./src/findContentFilesInSource";
import { createStaticFiles } from "./src/createStaticFiles";
import { log, error, cc } from "./src/console";
import { clearDirectory } from "./src/clearDirectory";
import { findTemplatesInContentFiles } from "./src/findTemplatesInContentFiles";
import { getDOM } from "./src/fileWrapper";
import { settings } from "./src/settings";
import { Parcel } from "@parcel/core";
import { existsSync } from "fs";

const startTime = Date.now();

try {
  // Get directories and index file
  const dirs = sourceDirs(args);
  if (!existsSync(dirs.sourceIndex)) {
    error(`"${dirs.sourceIndex}" does not exist`);
  }

  if (settings.clean && existsSync(dirs.distDir)) {
    log(`clearing "${dirs.distDir}"...`);
    clearDirectory(dirs.distDir);
  }

  if (settings.noCache || settings.clean) {
    log(`clearing "${dirs.cacheDir}"...`);
    clearDirectory(dirs.cacheDir);
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

      createStaticFiles(dirs, routerOptions, contentFiles, templateFiles);

      log(
        ` ${cc.bg.green}${cc.fg.black} Build done in ${(
          (Date.now() - startTime) /
          1000
        ).toFixed(2)} seconds ${cc.reset}`
      );
    })
    .catch((err) => {
      error("Parcel build failed", err);
    });
} catch (err) {
  error(err);
}
