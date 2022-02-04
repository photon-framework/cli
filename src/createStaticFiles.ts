import type { sourceDirsObj } from "./sourceDirs.js";
import type { routerOptions } from "./parseSourceIndex.js";
import { mapRoutingAnchors } from "./mapRoutingAnchors.js";
import { domRenderOptions } from "./domRenderOptions.js";
import { error, log } from "./console.js";
import { parseDocument } from "htmlparser2";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { relative, join } from "path";
import { findOne } from "domutils";
import render from "dom-serializer";

export const createStaticFiles = (
  dirs: sourceDirsObj,
  routerOptions: routerOptions,
  contentFilesDirs: Array<string>
) => {
  const origHtml = readFileSync(dirs.distIndex).toString();
  const dom = parseDocument(origHtml);

  mapRoutingAnchors(dom);

  // read content files
  const contentFiles = new Map(
    contentFilesDirs.map((dir) => {
      const content = readFileSync(dir).toString();
      const relativePath = relative(routerOptions.contentDir, dir).replace(
        /^[\/\\]/,
        ""
      );
      return [
        relativePath.substring(0, relativePath.length - 5),
        parseDocument(content),
      ];
    })
  );

  const routerEl = findOne(
    (el) => "photon-router" in el.attribs,
    dom.childNodes
  );
  if (!routerEl) {
    error(
      `"${dirs.distIndex}" does not contain a element that has the "photon-router" boolean-attribute`
    );
    process.exit(1);
  }

  log("Writing router paths...");

  const routerEmoji: string = "";

  // default
  if (contentFiles.has(routerOptions.defaultSite)) {
    log(routerEmoji, routerOptions.defaultSite, "(default)");
    routerEl.children = [contentFiles.get(routerOptions.defaultSite)!];
    routerEl.attribs["data-route"] = routerOptions.defaultSite;
    writeFileSync(dirs.distIndex, render(dom, domRenderOptions));
  }

  // fallback
  if (contentFiles.has(routerOptions.fallbackSite)) {
    log(routerEmoji, routerOptions.fallbackSite, "(fallback)");
    routerEl.children = [contentFiles.get(routerOptions.fallbackSite)!];
    routerEl.attribs["data-route"] = routerOptions.fallbackSite;
    writeFileSync(
      join(dirs.distDir, "404.html"),
      render(dom, domRenderOptions)
    );
  }

  // other
  for (const [path, content] of contentFiles) {
    if (contentFiles.has(path)) {
      log(routerEmoji, path);
      routerEl.children = [content];
      routerEl.attribs["data-route"] = path;
      const distPath = join(dirs.distDir, path);
      if (!existsSync(distPath)) {
        mkdirSync(distPath, { recursive: true });
      }

      writeFileSync(
        join(distPath, "index.html"),
        render(dom, domRenderOptions)
      );
    }
  }
};
