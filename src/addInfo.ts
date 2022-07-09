import { document } from "./dom";
import { exit, options } from "./cli";
import { router } from "./router";
import { join as systemJoin } from "path";
import { join as posixJoin } from "path/posix";

export const started = new Date();

const canonicalLinkEl = document.querySelector(
  "link[rel='canonical']"
) as HTMLLinkElement | null;
const url = canonicalLinkEl
  ? new URL(canonicalLinkEl.href)
  : exit(400, "No canonical link found in the HTML");

export const origin = url.origin + url.pathname;

export const serverUrl = (path: string) => {
  const cUrl = new URL(url);
  cUrl.pathname = posixJoin(url.pathname, path);
  return cUrl.href;
};

export const routes = (() => {
  systemJoin(options.path, router.dataset.content);
})();
