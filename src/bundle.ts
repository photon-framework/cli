import { exit, log, logLevel, options, stopCrashGuard } from "./cli";
import { relative } from "path";
import { join as joinPosix } from "path/posix";
import { Parcel } from "@parcel/core";
import type { InitialParcelOptions, BuildFailureEvent } from "@parcel/types";
import { openUri } from "./windows";

const baseParcelOptions: InitialParcelOptions = {
  entries: joinPosix(relative(process.cwd(), options.source), "**/*.html"),
  cacheDir: "./.photon-cache",
  shouldAutoInstall: true,
  shouldContentHash: true,
  defaultConfig: "@parcel/config-default",
  targets: {
    default: {
      distDir: options.dist,
      sourceMap: true,
      context: "browser",
      engines: {
        browsers: ["> 0.5%", "last 3 versions", "Firefox ESR", "not dead"],
      },
    },
  },
};

export const handleBuildFailureEvent = (
  err: Error | BuildFailureEvent,
  exitApp: boolean
) => {
  const diag = (err as BuildFailureEvent).diagnostics;

  if (diag) {
    if (diag.length === 1) {
      log(diag[0]!.message, logLevel.error);
      if (diag[0]!.hints) {
        for (const h of diag[0]!.hints) {
          log(h, logLevel.verbose);
        }
      }

      if (exitApp) {
        exit(500, diag[0]!.message);
      }
    } else {
      for (const d of diag) {
        log(d.message, logLevel.error);
        if (d.hints) {
          for (const h of d.hints) {
            log(h, logLevel.verbose);
          }
        }
      }

      if (exitApp) {
        exit(500, "Build failed");
      }
    }
  } else {
    if (exitApp) {
      if ((err as Error).message) {
        exit(500, (err as Error).message);
      } else {
        exit(500, "Build failed");
      }
    } else {
      if ((err as Error).message) {
        log((err as Error).message, logLevel.error);
      } else {
        log("Build failed", logLevel.error);
      }
    }
  }
};

export const bundle = async () => {
  log(`Bundling "${options.source}"`);

  const bundler = new Parcel({
    ...baseParcelOptions,
    mode: "development",
    env: {
      NODE_ENV: "production",
    },
  });

  try {
    const { bundleGraph } = await bundler.run();
    const bundles = bundleGraph.getBundles();
    for (const b of bundles) {
      log(`Bundle ${b.name} <${b.type.toUpperCase()}>`, logLevel.verbose);
    }
  } catch (err) {
    handleBuildFailureEvent(err as BuildFailureEvent, true);
  }
};

export const serve = () => {
  log(`Serve "${options.source}"`);

  const bundler = new Parcel({
    ...baseParcelOptions,
    mode: "development",
    env: {
      NODE_ENV: "development",
    },
    serveOptions: {
      port: options.serve,
    },
    hmrOptions: {
      port: options.serve,
    },
  });

  const subscription = bundler.watch((err, event) => {
    if (err) {
      log(err.message, logLevel.error);
    } else if (event) {
      if (event.type === "buildSuccess") {
        const bundles = event.bundleGraph.getBundles();
        log(`Built ${bundles.length} bundles`, logLevel.info);
      } else if (event.type === "buildFailure") {
        handleBuildFailureEvent(event, false);
      }
    }
  });

  stopCrashGuard();

  log("Waiting for build to complete...", logLevel.info);
  setTimeout(() => {
    log(`Serving on http://localhost:${options.serve}`, logLevel.info);
    if (options.open) {
      openUri(`http://localhost:${options.serve}`);
    }
  }, 4000);

  return subscription;
};
