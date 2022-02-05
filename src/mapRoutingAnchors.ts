import { Document } from "domhandler";
import { findAll } from "domutils";
import { join } from "path";

export const mapRoutingAnchors = (dom: Document, location: string = "/") => {
  for (const a of findAll(
    (el) => el.name === "a" && "data-route" in el.attribs,
    dom.childNodes
  )) {
    const dataRoute = a.attribs["data-route"];
    if (!dataRoute) {
      continue;
    }
    a.attribs["href"] =
      dataRoute[0] === "/" ? dataRoute : join(location, dataRoute);
  }
};
