import type { sourceDirsObj } from "./sourceDirs";
import type { InitialParcelOptions } from "@parcel/types";

export const parcelOptions = (
  dirs: sourceDirsObj,
  contentFiles: Array<string>
): InitialParcelOptions => ({
  entries: [dirs.sourceIndex, ...contentFiles],
  defaultTargetOptions: {
    distDir: dirs.distDir,
    engines: {
      browsers: ["last 2 versions"],
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
  },
});
