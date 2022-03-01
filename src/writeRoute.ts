import { exportDOM } from "./fileWrapper";
import type { Document, Element, NodeWithChildren } from "domhandler";
import { dirname, join, normalize } from "path";
import { existsSync, mkdirSync } from "fs";
import { resolveTemplates } from "./resolveTemplates";

const routerEmoji: string = "";

export const writeRoute = (
  dom: Document,
  routerEl: Element,
  rootPath: string,
  route: string,
  content: NodeWithChildren,
  dataRoute: string = route
) => {
  console.log(routerEmoji, route);
  routerEl.children = [resolveTemplates(content, rootPath)];
  const virtualLocation = normalize("/" + dataRoute);
  routerEl.attribs["data-route"] = virtualLocation;
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
