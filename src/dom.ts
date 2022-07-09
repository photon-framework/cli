import { exit, options } from "./cli";
import { JSDOM } from "jsdom";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

const indexHtmlPath = join(options.dist, "index.html");

if (!existsSync(indexHtmlPath)) {
  exit(400, `No "index.html" found in "${options.dist}"`);
}

export const dom = new JSDOM(readFileSync(indexHtmlPath, "utf8"));

export const window = dom.window;
export const document = dom.window.document;

(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;
(globalThis as any).location = dom.window.location;
(globalThis as any).history = dom.window.history;
(globalThis as any).screen = dom.window.screen;
