import { exit, log, logLevel, options } from "./src/cli";
import tryToCatch from "try-to-catch";
import { join } from "path";
import { writeFile } from "fs/promises";
import { bundle, serve } from "./src/bundle";

if (!isNaN(options.serve) && options.serve) {
  serve();
} else {
  tryToCatch(async () => {
    {
      const [err] = await tryToCatch(require("./src/prebuild").prebuild);
      if (err) {
        exit(500, err);
      }
    }

    {
      const [err] = await tryToCatch(bundle);
      if (err) {
        exit(500, err);
      }
    }

    {
      const [err] = await tryToCatch(require("./src/webmanifest").webmanifest);
      if (err) {
        exit(500, err);
      }
    }

    if (options.noRobots) {
      log("Skipping robots.txt generation", logLevel.info);
    } else {
      const { createRobots } = require("./src/createRobots");
      const robotsTxtLocation = join(options.dist, "robots.txt");
      log("Generating robots.txt");
      const [err] = await tryToCatch(
        writeFile,
        robotsTxtLocation,
        createRobots(),
        "utf8"
      );
      if (err) {
        exit(500, err);
      }
    }

    if (options.noSitemap) {
      log("Skipping sitemap.xml generation", logLevel.info);
    } else {
      const { createSitemap } = require("./src/createSitemap");
      const sitemapXmlLocation = join(options.dist, "sitemap.xml");
      log("Generating sitemap.xml");
      const [err] = await tryToCatch(
        writeFile,
        sitemapXmlLocation,
        createSitemap(),
        "utf8"
      );
      if (err) {
        exit(500, err);
      }
    }

    {
      log("Prerendering routes");
      const [err] = await tryToCatch(require("./src/prerender").prerender);
      if (err) {
        exit(500, err);
      }
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
