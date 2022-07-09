import { join } from "path";
import { writeFile } from "fs/promises";
import { exit, log, logLevel, options } from "./src/cli";
import { createRobots } from "./src/createRobots";
import { createSitemap } from "./src/createSitemap";
import { prerender } from "./src/prerender";
import tryToCatch from "try-to-catch";

tryToCatch(async () => {
  // robots.txt
  if (options["no-robots"]) {
    log("Skipping robots.txt generation", logLevel.info);
  } else {
    const robotsTxtLocation = join(options.path, "robots.txt");
    log("Generating robots.txt");
    await tryToCatch(writeFile, robotsTxtLocation, createRobots(), "utf8");
  }

  // sitemap.xml
  if (options["no-sitemap"]) {
    log("Skipping sitemap.xml generation", logLevel.info);
  } else {
    const sitemapXmlLocation = join(options.path, "sitemap.xml");
    log("Generating sitemap.xml");
    await tryToCatch(writeFile, sitemapXmlLocation, createSitemap(), "utf8");
  }

  // prerender routes
  log("Prerendering routes");
  await tryToCatch(prerender);
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
