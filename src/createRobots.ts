import { existsSync } from "fs";
import { join } from "path";
import { serverUrl } from "./addInfo";
import { log, logLevel, options } from "./cli";
import { router } from "./router";
import { filesIn, fileToRoute } from "./tools";

export const createRobots = (): string => {
  const robots = ["User-agent: *"];

  if (router.dataset.homeAsEmpty) {
    robots.push("Allow: /");
  }

  for (const file of filesIn(router.dataset.content)) {
    log(`Disallowing "${file}" in robots.txt`, logLevel.verbose);
    robots.push("Disallow: " + file);

    const routed = fileToRoute(file);
    if (
      routed === router.dataset.default ||
      routed !== router.dataset.fallback
    ) {
      log(`Allowing "${routed}" in robots.txt`, logLevel.verbose);
      robots.push("Allow: " + routed);
    } else {
      log(`Skipping "${routed}" for robots.txt`, logLevel.verbose);
    }
  }

  if (!options.noSitemap || existsSync(join(options.dist, "sitemap.xml"))) {
    robots.push("Sitemap: " + serverUrl("sitemap.xml"));
  } else {
    log("Skipping sitemap.xml in robots.txt", logLevel.info);
  }

  return robots.join("\n") + "\n";
};
