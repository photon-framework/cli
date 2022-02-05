import { domRenderOptions } from "./domRenderOptions.js";
import { parseDocument } from "htmlparser2";
import { readFileSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { render } from "@frank-mayer/dom-serializer";
import type { Document } from "domhandler";
import type { sourceDirsObj } from "./sourceDirs.js";

const DOMcache = new Map<string, Document>();

export const getDOM = (file: string): Document => {
  if (DOMcache.has(file)) {
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

export const sourceToDist = (dirs: sourceDirsObj, path: string): string =>
  join(dirs.distDir, relative(dirs.sourceDir, path));
