import type { sourceDirsObj } from "./sourceDirs.js";
import type { routerOptions } from "./parseSourceIndex.js";
import { mapRoutingAnchors } from "./mapRoutingAnchors.js";
import { mapReferences } from "./mapReferences.js";
import { error, log } from "./console.js";
import { exportDOM, getDOM } from "./fileWrapper.js";
import { existsSync, mkdirSync } from "fs";
import { relative, join } from "path";
import { findOne } from "domutils";
import type { Document, Element } from "domhandler";

const routerEmoji: string = "";

const readDomFromContentFileDirs = (
  routerOptions: routerOptions,
  contentFilesDirs: Iterable<string>
) =>
  new Map(
    Array.from(contentFilesDirs).map((dir) => {
      const relativePath = relative(routerOptions.contentDir, dir).replace(
        /^[\/\\]/,
        ""
      );
      return [relativePath.substring(0, relativePath.length - 5), getDOM(dir)];
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
  contentFilesDirs: Iterable<string>
) => {
  const dom = getDOM(dirs.distIndex);

  // read content dom of files
  const contentFiles = readDomFromContentFileDirs(
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
};
