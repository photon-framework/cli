import type { sourceDirsObj } from "./sourceDirs";
import { error, log } from "./console";
import { readFileSync } from "fs";
import { join } from "path";
import { findAll } from "domutils";
import { parseDocument } from "htmlparser2";

export type routerOptions = {
  contentDir: string;
  defaultSite: string;
  fallbackSite: string;
};

export const parseSourceIndex = (dirs: sourceDirsObj): routerOptions => {
  const dom = parseDocument(readFileSync(dirs.sourceIndex).toString());
  const nodes = dom.childNodes;

  const routers = findAll((el) => el.name === "photon:router", nodes);
  if (routers.length !== 1) {
    error("Exactly one router element is required");
    process.exit(1);
  }
  const router = routers[0]!;

  const routerOptions = {
    contentDir: router.attribs["data-content"] as string,
    defaultSite: router.attribs["data-default"] as string,
    fallbackSite: router.attribs["data-fallback"] as string,
  };

  if (routerOptions.contentDir) {
    routerOptions.contentDir = join(dirs.sourceDir, routerOptions.contentDir);
  } else {
    error("data-content attribute is required for router");
    process.exit(1);
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
    process.exit(1);
  }

  log("Router options:", routerOptions);

  return routerOptions;
};
