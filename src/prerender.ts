import { log, logLevel, options, exit } from "./cli";
import { filesIn, fileToRoute } from "./tools";
import { document, dom } from "./dom";
import { router } from "./router";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { view } from "./view";
import tryToCatch from "try-to-catch";
import { minify } from "html-minifier";
import type { Options as MinifyOptions } from "html-minifier";
import { canonicalLinkEl, serverUrl } from "./addInfo";

const minifyOptions: MinifyOptions = {
  caseSensitive: true,
  collapseBooleanAttributes: true,
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  continueOnParseError: true,
  minifyCSS: true,
  minifyJS: true,
  removeComments: true,
};

const refMap = new Map<string, string>();

export const prerender = async (): Promise<void> => {
  {
    const indexHtml = options.noMinify
      ? dom.serialize()
      : minify(dom.serialize(), minifyOptions);
    const indexHtmlPath = join(options.dist, "index.html");
    log('Prerendering "/"', logLevel.verbose);
    await writeFile(indexHtmlPath, indexHtml);
  }

  for (const file of filesIn("content")) {
    const route = fileToRoute(file);

    if (route === router.dataset.default || route !== router.dataset.fallback) {
      log(`Prerendering "${route}"`, logLevel.verbose);

      const [error, data] = await tryToCatch(
        readFile,
        join(options.dist, file),
        "utf8"
      );

      if (error) {
        exit(500, error.message);
      } else if (typeof data === "string") {
        router.innerHTML = data;
      } else {
        router.innerHTML = data.toString();
      }

      if (router.dataset.langSegment) {
        const langIndex = Number.parseInt(router.dataset.langSegment, 10);
        const lang = route.split("/").filter(Boolean)[langIndex];
        document.documentElement.lang = lang || "";
      }

      const canonicalHref =
        route === router.dataset.default ? serverUrl("/") : serverUrl(route);

      canonicalLinkEl.href = canonicalHref;

      {
        const ogUrlEl = document.querySelector(
          "meta[property='og:url']"
        ) as HTMLMetaElement | null;
        if (ogUrlEl) {
          ogUrlEl.content = canonicalHref;
        }
      }

      {
        const twitterEl = document.querySelector(
          "meta[property='twitter:url']"
        ) as HTMLMetaElement | null;
        if (twitterEl) {
          twitterEl.content = canonicalHref;
        }
      }

      for (const script of Array.from(router.getElementsByTagName("script"))) {
        script.remove();
      }

      let el: HTMLElement | undefined;

      while (
        (el = document.querySelector("photon-ref[src]") as
          | HTMLElement
          | undefined)
      ) {
        const src = el.getAttribute("src")!;
        const refHtml = await (async () => {
          if (refMap.has(src)) {
            return refMap.get(src)!;
          } else {
            const [error, ref] = await tryToCatch(
              readFile,
              join(options.dist, src),
              "utf8"
            );

            if (error) {
              return exit(500, error.message);
            } else {
              refMap.set(src, ref as string);
              return ref;
            }
          }
        })();

        el.outerHTML = Mustache.render(
          refHtml as string,
          view.plus(el.dataset)
        );
      }

      const dir = join(options.dist, route);
      if (!existsSync(dir)) {
        log(`Creating directory "${dir}"`, logLevel.verbose);
        const [error0] = await tryToCatch(mkdir, dir, {
          recursive: true,
        });
        if (error0) {
          exit(500, error0.message);
        }
      }

      const htmlOut = dom.serialize();

      const [error1] = await tryToCatch(
        writeFile,
        join(dir, "index.html"),
        options.noMinify ? htmlOut : minify(htmlOut, minifyOptions),
        "utf8"
      );
      if (error1) {
        exit(500, error1.message);
      }
    } else {
      log(`Skipping "${route}" for prerendering`, logLevel.verbose);
    }
  }
};
