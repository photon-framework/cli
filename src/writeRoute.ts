import { exportDOM } from "./fileWrapper";
import type { Document, Element, NodeWithChildren } from "domhandler";
import { dirname, join, normalize, resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import { resolveTemplates } from "./resolveTemplates";
import type { RouterOptions } from "./routerOptions";
import { getLangFromPath } from "./getLangFromPath";
import { findAll, findOne } from "domutils";

const routerEmoji: string = "";

export const writeRoute = (
  dom: Document,
  routerEl: Element,
  rootPath: string,
  route: string,
  content: NodeWithChildren,
  routerOptions: RouterOptions,
  dataRoute: string = route
) => {
  console.log(routerEmoji, route);

  routerEl.children = [resolveTemplates(content, rootPath)];

  routerEl.attribs["data-route"] = normalize("/" + dataRoute);

  const htmlEl = findOne((el) => el.tagName === "html", dom.childNodes);
  if (htmlEl) {
    let lang = getLangFromPath(dataRoute, routerOptions);
    if (lang) {
      if (lang.endsWith(".html")) {
        lang = getLangFromPath(routerOptions.defaultSite, routerOptions);
        if (lang) {
          htmlEl.attribs["lang"] = lang;
        }
      } else {
        htmlEl.attribs["lang"] = lang;
      }
    }
  }

  const anchors = findAll(
    (el) => el.tagName === "a" && "data-route" in el.attribs,
    dom.childNodes
  );
  for (const a of anchors) {
    a.attribs.href = resolve(
      routerEl.attribs["data-route"],
      a.attribs["data-route"]!
    );
  }

  if (routerOptions.canonical) {
    const canonicalEl = findOne(
      (el) =>
        el.tagName === "link" &&
        "rel" in el.attribs &&
        el.attribs.rel === "canonical",
      dom.childNodes
    );
    if (canonicalEl) {
      let canonical = routerOptions.canonical;
      if (!canonical.endsWith("/")) {
        canonical += "/";
      }

      if (dataRoute.startsWith("/")) {
        canonical += dataRoute.substring(1);
      } else {
        canonical += dataRoute;
      }

      canonicalEl.attribs.href = canonical;
    }
  }

  if (route.endsWith(".html")) {
    const distPath = join(rootPath, route);
    const distDir = dirname(distPath);
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    exportDOM(dom, distPath);
  } else {
    const distDir = join(rootPath, route);
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    exportDOM(dom, join(distDir, "index.html"));
  }
};
