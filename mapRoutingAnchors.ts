import { Document } from "domhandler";
import { findAll } from "domutils";

export const mapRoutingAnchors = (dom: Document) => {
  for (const a of findAll(
    (el) => el.name === "a" && "data-route" in el.attribs,
    dom.childNodes
  )) {
    a.attribs["href"] = a.attribs["data-route"]!;
  }
};
