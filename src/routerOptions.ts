import { Document } from "domhandler";
import { findOne } from "domutils";
import { findRouterEl } from "./findRouterEl";

const tailingOrLeadingSlash = new RegExp("^[\\/\\\\]|[\\/\\\\]$");

export type RouterOptions = Readonly<{
  contentDir: string;
  defaultSite: string;
  fallbackSite: string;
  langSegment: number;
  canonical: string | undefined;
}>;

export const getRouterOptions = (dom: Document): RouterOptions => {
  const nodes = dom.childNodes;

  const canonical = findOne(
    (el) =>
      el.name === "link" &&
      "rel" in el.attribs &&
      el.attribs["rel"] === "canonical" &&
      "href" in el.attribs,
    nodes
  );

  const routerEl = findRouterEl(dom);

  const routerOptions = {
    contentDir: routerEl.attribs["data-content"] as string,
    defaultSite: routerEl.attribs["data-default"] as string,
    fallbackSite: routerEl.attribs["data-fallback"] as string,
    langSegment: Number(routerEl.attribs["data-lang-segment"]),
    canonical: canonical ? canonical.attribs["href"] : undefined,
  };

  if (routerOptions.defaultSite) {
    routerOptions.defaultSite = routerOptions.defaultSite.replace(
      tailingOrLeadingSlash,
      ""
    );

    routerOptions.fallbackSite = routerOptions.fallbackSite
      ? routerOptions.fallbackSite.replace(tailingOrLeadingSlash, "")
      : routerOptions.defaultSite;
  } else {
    console.error("data-default-site attribute is required for router");
  }

  console.log("Router options:", routerOptions);

  return Object.freeze(routerOptions);
};
