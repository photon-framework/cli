import { EOL } from "os";
import { ensureWebPath } from "./ensureWebPath";

export const createRobots = (
  pathsAllow: Iterable<string>,
  pathsDisallow: Iterable<string>,
  sitemap?: string
) => {
  console.log("Creating robots.txt");

  const robots = [
    "User-agent: *",
    "Disallow: /content/*",
    "Disallow: *.css",
    "Disallow: *.js",
  ];

  for (const path of pathsDisallow) {
    robots.push(`Disallow: /${ensureWebPath(path)}`);
  }

  for (const path of pathsAllow) {
    robots.push(`Allow: /${ensureWebPath(path)}`);
  }

  if (sitemap) {
    robots.push("Sitemap: " + ensureWebPath(sitemap));
  }

  return robots.join(EOL) + EOL;
};
