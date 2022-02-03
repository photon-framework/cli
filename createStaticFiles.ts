import type { sourceDirsObj } from "./sourceDirs";
import type { routerOptions } from "./parseSourceIndex";
import { error } from "./console";
import { parseDocument } from "htmlparser2";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { relative, join } from "path";
import { findOne } from "domutils";
import render from "dom-serializer";

const domRenderOptions = {
  selfClosingTags: true,
};

export const createStaticFiles = (
  dirs: sourceDirsObj,
  routerOptions: routerOptions,
  contentFilesDirs: Array<string>
) => {
  const origHtml = readFileSync(dirs.distIndex).toString();
  const dom = parseDocument(origHtml);

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

  console.debug("contentFiles:", contentFiles);

  const routerEl = findOne((el) => el.name === "photon:router", dom.childNodes);
  if (!routerEl) {
    error(`"${dirs.distIndex}" does not contain a <photon:router> element`);
    process.exit(1);
  }

  routerEl.name = "router";
  routerEl.attribs = {};

  // default
  if (contentFiles.has(routerOptions.fallbackSite)) {
    routerEl.children = [contentFiles.get(routerOptions.defaultSite)!];
    writeFileSync(dirs.distIndex, render(dom, domRenderOptions));
  }

  // fallback
  if (contentFiles.has(routerOptions.fallbackSite)) {
    routerEl.children = [contentFiles.get(routerOptions.fallbackSite)!];
    writeFileSync(
      join(dirs.distDir, "404.html"),
      render(dom, domRenderOptions)
    );
  }

  // other
  for (const [path, content] of contentFiles) {
    if (contentFiles.has(path)) {
      routerEl.children = [content];
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
