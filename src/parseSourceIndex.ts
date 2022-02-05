import type { sourceDirsObj } from "./sourceDirs.js";
import { error, log } from "./console.js";
import { join } from "path";
import { findOne } from "domutils";
import type { Document } from "domhandler";

export type routerOptions = {
  contentDir: string;
  defaultSite: string;
  fallbackSite: string;
};

const ensureRuntimeIncluded = (dom: Document) => {
  if (
    !findOne(
      (el) =>
        el.name === "script" &&
        "src" in el.attribs &&
        (el.attribs["src"]!.endsWith("photon-re/core.js") ||
          el.attribs["src"]!.endsWith("photon-re/core.ts")),
      dom.childNodes
    )
  ) {
    error("No runtime script found");
  }
};

const getRouterOptions = (dom: Document, dirs: sourceDirsObj) => {
  const nodes = dom.childNodes;

  const router = findOne((el) => "photon-router" in el.attribs, nodes);
  if (!router) {
    error("No router element found");
  }

  const routerOptions = {
    contentDir: router!.attribs["data-content"] as string,
    defaultSite: router!.attribs["data-default"] as string,
    fallbackSite: router!.attribs["data-fallback"] as string,
  };

  if (routerOptions.contentDir) {
    routerOptions.contentDir = join(dirs.sourceDir, routerOptions.contentDir);
  } else {
    error("data-content attribute is required for router");
  }

  if (routerOptions.defaultSite) {
    routerOptions.defaultSite = routerOptions.defaultSite.replace(
      /^[\/\\]|[\/\\]$/,
      ""
    );

    routerOptions.fallbackSite = routerOptions.fallbackSite
      ? routerOptions.fallbackSite.replace(/^[\/\\]|[\/\\]$/, "")
      : routerOptions.defaultSite;
  } else {
    error("data-default-site attribute is required for router");
  }

  log("Router options:", routerOptions);

  return routerOptions;
};

export const parseSourceIndex = (
  dom: Document,
  dirs: sourceDirsObj
): routerOptions => {
  ensureRuntimeIncluded(dom);

  return getRouterOptions(dom, dirs);
};
