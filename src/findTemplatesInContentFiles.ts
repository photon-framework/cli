import type { sourceDirsObj } from "./sourceDirs";
import { getDOM } from "./fileWrapper";
import type { Document } from "domhandler";
import { findAll } from "domutils";
import { join } from "path";

export const findTemplatesInContentFiles = (
  indexDOM: Document,
  dirs: sourceDirsObj,
  contentFiles: Iterable<string>
) => {
  const doms = [indexDOM];

  for (const contentFile of contentFiles) {
    doms.push(getDOM(contentFile));
  }

  const templateFiles = new Set<string>();

  for (const dom of doms) {
    for (const el of findAll(
      (el) => el.tagName === "photon-ref" && "src" in el.attribs,
      dom.childNodes
    )) {
      const absPath = join(dirs.sourceDir, el.attribs.src!);
      templateFiles.add(absPath);
    }
  }

  return templateFiles;
};
