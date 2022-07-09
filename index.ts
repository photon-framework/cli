import { join } from "path";
import { writeFileSync } from "fs";
import { exit, log, logLevel, options } from "./src/cli";
import { createRobots } from "./src/createRobots";
import { createSitemap } from "./src/createSitemap";

// robots.txt
if (options["no-robots"]) {
  log("Skipping robots.txt generation", logLevel.info);
} else {
  const robotsTxtLocation = join(options.path, "robots.txt");
  log("Generating robots.txt");
  writeFileSync(robotsTxtLocation, createRobots(), "utf8");
}

// sitemap.xml
if (options["no-sitemap"]) {
  log("Skipping sitemap.xml generation", logLevel.info);
} else {
  const sitemapXmlLocation = join(options.path, "sitemap.xml");
  log("Generating sitemap.xml");
  writeFileSync(sitemapXmlLocation, createSitemap(), "utf8");
}

exit();
