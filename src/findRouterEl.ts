import { Document, Element } from "domhandler";
import { findOne } from "domutils";

let routerElCache: Element | null = null;

export const findRouterEl = (dom: Document) => {
  if (routerElCache) {
    return routerElCache;
  }

  const routerEl = findOne(
    (el) => "photon-router" in el.attribs,
    dom.childNodes
  );

  if (!routerEl) {
    throw new Error("No router element found");
  }

  return (routerElCache = routerEl);
};
