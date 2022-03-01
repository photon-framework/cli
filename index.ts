const [, , ...args] = process.argv;

import { getDirs } from "./src/getDirs";
import { exportDOM, getDOM } from "./src/fileWrapper";
import { getRouterOptions } from "./src/routerOptions";
import { getContentPathsList } from "./src/getContentPathsList";
import { findRouterEl } from "./src/findRouterEl";
import { writeRoute } from "./src/writeRoute";
import { createSitemap } from "./src/createSitemap";
import { createRobots } from "./src/createRobots";
import { resolveTemplates, templateCache } from "./src/resolveTemplates";
import { dirname, join, relative } from "path";
import { existsSync, writeFileSync } from "fs";
import { findAll } from "domutils";

// Get directories and index file
const dirs = getDirs(args);
const contentFiles = getContentPathsList(dirs);

// Prerendered Pages
const sourceDom = resolveTemplates(getDOM(dirs.distIndex), dirs.distDir);
const routerOptions = getRouterOptions(sourceDom);
const routerEl = findRouterEl(sourceDom);
const contentPaths = new Set<string>();

for (const contentPath of contentFiles) {
  if (!contentPath.endsWith(".html")) {
    continue;
  }

  const content = getDOM(contentPath);

  const relativePath = relative(dirs.contentDir, contentPath);
  const route = relativePath.substring(0, relativePath.length - 5);
  if (route === routerOptions.fallbackSite) {
    continue;
  }
  contentPaths.add(route);
  writeRoute(sourceDom, routerEl, dirs.distDir, route, content);
}

{
  const content = getDOM(
    join(dirs.contentDir, routerOptions.defaultSite + ".html")
  );
  writeRoute(
    sourceDom,
    routerEl,
    dirs.distDir,
    "/",
    content,
    routerOptions.defaultSite
  );
}

// Fallback Page (404)
if (routerOptions.fallbackSite !== routerOptions.defaultSite) {
  const content = getDOM(
    join(dirs.contentDir, routerOptions.fallbackSite + ".html")
  );
  writeRoute(sourceDom, routerEl, dirs.distDir, "/404.html", content);
}

// sitemap.xml
const sitemapPath = join(dirs.distDir, "sitemap.xml");
let sitemapPresent = existsSync(sitemapPath);
if (!sitemapPresent && routerOptions.canonical) {
  sitemapPresent = true;
  writeFileSync(
    sitemapPath,
    createSitemap(contentPaths, routerOptions.canonical)
  );
}

// robots.txt
const robotsPath = join(dirs.distDir, "robots.txt");
if (routerOptions.canonical && !existsSync(robotsPath)) {
  writeFileSync(
    robotsPath,
    createRobots(
      contentPaths,
      Array.from(templateCache.keys()).map((path) =>
        relative(dirs.distDir, path)
      ),
      sitemapPresent ? join(routerOptions.canonical, "/sitemap.xml") : undefined
    )
  );
}

// Fix template links
for (const file of contentFiles) {
  const dom = getDOM(file, false);
  const photonRefElements = findAll(
    (el) => el.name === "photon-ref" && "src" in el.attribs,
    dom.childNodes
  );

  for (const el of photonRefElements) {
    el.attribs.src = relative(
      dirname(file),
      join(dirs.distDir, el.attribs.src!)
    );
  }

  exportDOM(dom, file);
}
