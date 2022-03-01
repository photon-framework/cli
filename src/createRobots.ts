import { EOL } from "os";

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
    robots.push(`Disallow: /${path}`);
  }

  for (const path of pathsAllow) {
    robots.push(`Allow: /${path}`);
  }

  if (sitemap) {
    robots.push("Sitemap: " + sitemap);
  }

  return robots.join(EOL) + EOL;
};
