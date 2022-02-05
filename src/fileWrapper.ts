import { parseDocument } from "htmlparser2";
import { readFileSync } from "fs";
import type { Document } from "domhandler";

const DOMcache = new Map<string, Document>();

export const getDOM = (file: string): Document => {
  if (DOMcache.has(file)) {
    return DOMcache.get(file)!;
  }

  const dom = parseDocument(readFileSync(file).toString());
  DOMcache.set(file, dom);
  return dom;
};
