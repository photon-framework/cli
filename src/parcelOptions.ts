import type { sourceDirsObj } from "./sourceDirs.js";
import type { InitialParcelOptions } from "@parcel/types";

export const parcelOptions = (
  dirs: sourceDirsObj,
  contentFiles: Iterable<string>,
  templateFiles: Iterable<string>
): InitialParcelOptions => ({
  entries: [dirs.sourceIndex, ...contentFiles, ...templateFiles],
  shouldDisableCache: true,
  // cacheDir: dirs.cacheDir,
  defaultTargetOptions: {
    distDir: dirs.distDir,
    engines: {
      browsers: ["last 2 versions", "ie >= 11", "safari >= 10"],
    },
    isLibrary: false,
    outputFormat: "global",
    shouldOptimize: true,
    sourceMaps: false,
  },
  mode: "production",
  logLevel: "verbose",
  defaultConfig: "@parcel/config-default",
  shouldAutoInstall: true,
  shouldContentHash: true,
  env: {
    NODE_ENV: "production",
    PARCEL_WORKERS: "0",
  },
});
