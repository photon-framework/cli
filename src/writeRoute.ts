import { exportDOM } from "./fileWrapper";
import type { Document, Element, NodeWithChildren } from "domhandler";
import { dirname, join, normalize } from "path";
import { existsSync, mkdirSync } from "fs";
import { resolveTemplates } from "./resolveTemplates";
import type { RouterOptions } from "./routerOptions";
import { getLangFromPath } from "./getLangFromPath";
import { findOne } from "domutils";

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
