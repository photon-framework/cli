import { options } from "./cli";
import { JSDOM } from "jsdom";

export const dom = new JSDOM(options.input);

(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;
(globalThis as any).location = dom.window.location;
(globalThis as any).history = dom.window.history;
(globalThis as any).screen = dom.window.screen;
