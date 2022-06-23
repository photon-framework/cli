import { EOL } from "os";
import { ensurePosixPath } from "./ensurePosixPath";

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
    robots.push(`Disallow: /${ensurePosixPath(path)}`);
  }

  for (const path of pathsAllow) {
    robots.push(`Allow: /${ensurePosixPath(path)}`);
  }

  if (sitemap) {
    robots.push("Sitemap: " + ensurePosixPath(sitemap));
  }

  return robots.join(EOL) + EOL;
};
