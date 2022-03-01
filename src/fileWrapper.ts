import { domRenderOptions } from "./domRenderOptions";
import { parseDocument } from "htmlparser2";
import { readFileSync, writeFileSync } from "fs";
import { render } from "@frank-mayer/dom-serializer";
import type { Document } from "domhandler";
import { normalize } from "path";

const DOMcache = new Map<string, Document>();

export const getDOM = (file: string, useCache: boolean = true): Document => {
  file = normalize(file);

  if (useCache && DOMcache.has(file)) {
    return DOMcache.get(file)!;
  }

  const dom = parseDocument(readFileSync(file).toString());
  DOMcache.set(file, dom);
  return dom;
};

export const exportDOM = (dom: Document, file: string): void => {
  DOMcache.set(file, dom);
  writeFileSync(file, render(dom, domRenderOptions));
};
