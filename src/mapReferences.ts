import { warn } from "./console";
import type { Document } from "domhandler";
import { findAll, replaceElement } from "domutils";
import { parseDocument } from "htmlparser2";
import { readFileSync } from "fs";
import { join } from "path";

export const mapReferences = (dom: Document, workingDir: string) => {
  for (const el of findAll(
    (el) => el.tagName === "photon-ref" && "src" in el.attribs,
    dom.childNodes
  )) {
    const html = readFileSync(join(workingDir, el.attribs.src!)).toString();

    const dataset = new Map<string, string>();
    for (const key in el.attribs) {
      if (key.startsWith("data-")) {
        dataset.set(key.substring(5), el.attribs[key]!);
      }
    }

    replaceElement(
      el,
      parseDocument(
        html.replace(/\{\{[^{}]+\}\}/g, (match) => {
          const key = match.substring(2, match.length - 2);

          if (dataset.has(key)) {
            return dataset.get(key)!;
          }

          warn(`Missing data-key "${key}" for "${el.attribs.src}"`);
          return "";
        })
      )
    );
  }
};
