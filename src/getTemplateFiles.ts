import type { sourceDirsObj } from "./sourceDirs.js";
import { getDOM } from "./fileWrapper.js";
import type { Document } from "domhandler";
import { findAll } from "domutils";
import { join } from "path";

export const getTemplateFiles = (
  dom: Document,
  dirs: sourceDirsObj,
  contentFiles: Iterable<string>
) => {
  const searchNodes = [...dom.childNodes];
  for (const contentFile of contentFiles) {
    searchNodes.push(...getDOM(contentFile).childNodes);
  }

  return new Set(
    findAll(
      (el) => el.tagName === "photon-ref" && "src" in el.attribs,
      searchNodes
    ).map((el) => join(dirs.sourceDir, el.attribs.src!))
  );
};
