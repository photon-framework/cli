import type { sourceDirsObj } from "./sourceDirs";
import type { routerOptions } from "./parseSourceIndex";
import { mapRoutingAnchors } from "./mapRoutingAnchors";
import { mapReferences } from "./mapReferences";
import { error, log } from "./console";
import { exportDOM, getDOM, sourceToDist } from "./fileWrapper";
import { createSitemap } from "./createSitemap";
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "fs";
import { relative, join } from "path";
import { findOne } from "domutils";
import type { Document, Element } from "domhandler";

const routerEmoji: string = "";

const leadingSlash = new RegExp("^[\\/\\\\]");

const readDomFromContentFileDirs = (
  dirs: sourceDirsObj,
  routerOptions: routerOptions,
  contentFilesDirs: Iterable<string>
) =>
  new Map(
    Array.from(contentFilesDirs).map((dir) => {
      const relativePath = relative(routerOptions.contentDir, dir).replace(
        leadingSlash,
        ""
      );

      return [
        relativePath.substring(0, relativePath.length - 5),
        getDOM(sourceToDist(dirs, dir)),
      ];
    })
  );

const writeRoute = (
  contentFiles: Map<string, Document>,
  dirs: sourceDirsObj,
  routerEl: Element,
  dom: Document,
  urlLocation: string,
  routeTarget: string
) => {
  const el = contentFiles.get(routeTarget);
  if (!el) {
    error(`No content file found for target "${routeTarget}"`);
    return;
  }

  log(
    routerEmoji,
    urlLocation.substring(dirs.distDir.length),
    "→",
    "/" + routeTarget
  );
  mapReferences(el, dirs.distDir);
  routerEl.children = [el];
  const virtualLocation = "/" + routeTarget;
  routerEl.attribs["data-route"] = virtualLocation;
  mapRoutingAnchors(dom, virtualLocation);
  mapReferences(dom, dirs.distDir);
  exportDOM(dom, urlLocation);
};

export const createStaticFiles = (
  dirs: sourceDirsObj,
  routerOptions: routerOptions,
  contentFilesDirs: Iterable<string>,
  templateFiles: Iterable<string>
) => {
  const dom = getDOM(dirs.distIndex);

  // read content dom of files
  const contentFiles = readDomFromContentFileDirs(
    dirs,
    routerOptions,
    contentFilesDirs
  );

  // find router in main index dom
  const routerEl = findOne(
    (el) => "photon-router" in el.attribs,
    dom.childNodes
  );
  if (!routerEl) {
    error(
      `"${dirs.distIndex}" does not contain a element that has the "photon-router" boolean-attribute`
    );
    return;
  }

  log("Writing static routes...");

  // default
  writeRoute(
    contentFiles,
    dirs,
    routerEl,
    dom,
    dirs.distIndex,
    routerOptions.defaultSite
  );

  // fallback
  writeRoute(
    contentFiles,
    dirs,
    routerEl,
    dom,
    join(dirs.distDir, "404.html"),
    routerOptions.defaultSite
  );

  // other
  for (const path of contentFiles.keys()) {
    const distPath = join(dirs.distDir, path);
    if (!existsSync(distPath)) {
      mkdirSync(distPath, { recursive: true });
    }
    writeRoute(
      contentFiles,
      dirs,
      routerEl,
      dom,
      join(distPath, "index.html"),
      path
    );
  }

  // sitemap
  const sitemapSrcPath = join(dirs.sourceDir, "sitemap.xml");
  const sitemapDistPath = join(dirs.distDir, "sitemap.xml");
  if (existsSync(sitemapSrcPath)) {
    log("Copy sitemap.xml to dist...");
    copyFileSync(sitemapSrcPath, sitemapDistPath);
  } else if (routerOptions.canonical) {
    log("Writing sitemap.xml...");
    writeFileSync(
      sitemapDistPath,
      createSitemap(contentFiles, routerOptions.canonical)
    );
  }

  // robots.txt
  const robotsSrcPath = join(dirs.sourceDir, "robots.txt");
  const robotsDistPath = join(dirs.distDir, "robots.txt");
  if (existsSync(robotsSrcPath)) {
    log("Copy robots.txt to dist...");
    copyFileSync(robotsSrcPath, robotsDistPath);
  } else if (routerOptions.canonical) {
    log("Writing robots.txt...");
    writeFileSync(
      robotsDistPath,
      [
        "User-agent: *",
        "Allow: /",
        `Disallow: /${relative(dirs.sourceDir, routerOptions.contentDir)}/*`,
        ...Array.from(templateFiles).map(
          (path) => "Disallow: /" + relative(dirs.sourceDir, path)
        ),
        "Disallow: /*.svg",
        "Disallow: /*.png",
        "Disallow: /*.jpg",
        "Disallow: /*.jpeg",
        "Disallow: /*.webp",
        "Disallow: /*.css",
        "Disallow: /*.js",
        "Disallow: /*.map",
        `Sitemap: ${routerOptions.canonical}/sitemap.xml\n`,
      ].join("\n")
    );
  }
};
