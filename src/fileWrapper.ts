import { domRenderOptions } from "./domRenderOptions";
import { parseDocument } from "htmlparser2";
import { writeFileSync } from "fs";
import { render } from "@frank-mayer/dom-serializer";
import type { Document } from "domhandler";
import { normalize } from "path";
import { readProcessedHtmlString } from "./readProcessedHtmlString";

const DOMcache = new Map<string, Document>();

export const getDOM = async (
  file: string,
  useCache: boolean = true
): Promise<Document> => {
  file = normalize(file);

  if (useCache && DOMcache.has(file)) {
    return DOMcache.get(file)!;
  }

  const dom = parseDocument(await readProcessedHtmlString(file));
  DOMcache.set(file, dom);
  return dom;
};

export const exportDOM = (dom: Document, file: string): void => {
  DOMcache.set(file, dom);
  writeFileSync(file, render(dom, domRenderOptions));
};
