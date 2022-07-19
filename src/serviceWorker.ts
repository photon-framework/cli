import Parcel from "@parcel/core";
import type { BuildFailureEvent } from "@parcel/types";
import { exists, existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { basename, join, relative } from "path";
import { handleBuildFailureEvent } from "./bundle";
import { exit, log, logLevel, options } from "./cli";
import { document } from "./dom";
import { hashToString } from "./hash";
import { tempDir } from "./temp";
import { systemToPosix } from "./tools";

export const serviceWorker = async () => {
  if (options.sw) {
    log(`Generating service worker`, logLevel.info);

    const entry = systemToPosix(relative(process.cwd(), options.sw));

    const bundler = new Parcel({
      entries: entry,
      cacheDir: "./.photon-cache/",
      shouldAutoInstall: true,
      shouldContentHash: true,
      defaultConfig: "@parcel/config-default",
      mode: "production",
      env: {
        NODE_ENV: "production",
      },
      targets: {
        default: {
          distDir: await tempDir,
          sourceMap: true,
          context: "service-worker",
        },
      },
    });

    try {
      const { bundleGraph } = await bundler.run();
      const bundles = bundleGraph.getBundles();
      if (bundles.length !== 1) {
        exit(
          500,
          `Expected exactly one output bundle for service worker but got ${bundles.length}`
        );
      } else {
        let content = await readFile(bundles[0]!.filePath, "utf8");
        const contentHash = await hashToString(content);
        const swName = `sw.${contentHash}.${bundles[0]!.type}`;
        const origSourceMap = bundles[0]!.filePath + ".map";
        if (existsSync(origSourceMap)) {
          const newSourceMap = swName + ".map";
          content = content.replace(basename(origSourceMap), newSourceMap);
          await writeFile(
            join(options.dist, newSourceMap),
            await readFile(origSourceMap, "utf8")
          );
        }
        await writeFile(join(options.dist, swName), content);
        log(`Service worker generated: "${swName}"`, logLevel.verbose);
        const swLoaderEl = document.createElement("script");
        swLoaderEl.textContent = `if("serviceWorker" in navigator){navigator.serviceWorker.register("/${swName}",{scope:"/"});}`;
        document.head.appendChild(swLoaderEl);
      }
    } catch (err) {
      handleBuildFailureEvent(err as BuildFailureEvent, true);
    }
  }
};
