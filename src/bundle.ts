import { exit, log, logLevel, options } from "./cli";
import { existsSync } from "fs";
import { relative } from "path";
import { join as joinPosix } from "path/posix";
import { Parcel } from "@parcel/core";
import type { BuildFailureEvent } from "@parcel/types";

export const bundle = async () => {
  if (options.source && existsSync(options.source)) {
    log(`Bundling "${options.source}"`);
    const entries = joinPosix(
      relative(process.cwd(), options.source),
      "**/*.html"
    );

    const bundler = new Parcel({
      entries,
      //   cacheDir: join(dirname(options.dist), ".photon-cache"),
      defaultConfig: "@parcel/config-default",
      /*mode: "production",
      defaultTargetOptions: {
        engines: {
          browsers: [
            "last 5 Android versions",
            "last 5 Chrome versions",
            "last 5 ChromeAndroid versions",
            "last 5 Firefox versions",
            "last 5 FirefoxAndroid versions",
            "last 1 Explorer version",
            "last 5 Opera versions",
            "last 5 Safari versions",
            "last 5 iOS versions",
            "last 5 Samsung versions",
          ],
        },
      },
      env: {
        NODE_ENV: "production",
      },*/
    });

    try {
      const { bundleGraph, buildTime } = await bundler.run();
      const bundles = bundleGraph.getBundles();
      log(`Built ${bundles.length} bundles in ${buildTime}ms`);
    } catch (err) {
      const diag = (err as BuildFailureEvent).diagnostics;

      if (diag) {
        if (diag.length === 1) {
          log(diag[0]!.message, logLevel.error);
          if (diag[0]!.hints) {
            for (const h of diag[0]!.hints) {
              log(h, logLevel.verbose);
            }
          }
          exit(500, diag[0]!.message);
        } else {
          for (const d of diag) {
            log(d.message, logLevel.error);
            if (d.hints) {
              for (const h of d.hints) {
                log(h, logLevel.verbose);
              }
            }
          }

          exit(500, "Build failed");
        }
      } else {
        exit(500, err + "");
      }
    }
  }
};
