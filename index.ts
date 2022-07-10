import { exit, log, logLevel, options } from "./src/cli";
import tryToCatch from "try-to-catch";
import { join } from "path";
import { writeFile } from "fs/promises";
import { bundle, serve } from "./src/bundle";
import { prebuild } from "./src/prebuild";

if (!isNaN(options.serve) && options.serve) {
  serve();
} else {
  tryToCatch(async () => {
    const [a] = await tryToCatch(prebuild);
    if (a) {
      exit(500, a.message);
    }

    const [b] = await tryToCatch(bundle);
    if (b) {
      exit(500, b.message);
    }

    const [c] = await tryToCatch(async () => {
      const { createRobots } = require("./src/createRobots");
      const { createSitemap } = require("./src/createSitemap");
      const { prerender } = require("./src/prerender");

      // robots.txt
      if (options.noRobots) {
        log("Skipping robots.txt generation", logLevel.info);
      } else {
        const robotsTxtLocation = join(options.dist, "robots.txt");
        log("Generating robots.txt");
        await tryToCatch(writeFile, robotsTxtLocation, createRobots(), "utf8");
      }

      // sitemap.xml
      if (options.noSitemap) {
        log("Skipping sitemap.xml generation", logLevel.info);
      } else {
        const sitemapXmlLocation = join(options.dist, "sitemap.xml");
        log("Generating sitemap.xml");
        await tryToCatch(
          writeFile,
          sitemapXmlLocation,
          createSitemap(),
          "utf8"
        );
      }

      // prerender routes
      log("Prerendering routes");
      await tryToCatch(prerender);
    });
    if (c) {
      exit(500, c.message);
    }
  }).then(([err]) => {
    if (err) {
      if ((err as Error).message) {
        exit(500, (err as Error).message);
      } else {
        exit(500, String(err));
      }
    } else {
      exit();
    }
  });
}
