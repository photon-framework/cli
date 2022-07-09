import { log, logLevel, options, exit } from "./cli";
import { filesIn, fileToRoute } from "./tools";
import { document } from "./dom";
import { router } from "./router";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { view } from "./view";
import tryToCatch from "try-to-catch";

const refMap = new Map<string, string>();

export const prerender = async (): Promise<void> => {
  for (const file of filesIn("content")) {
    const route = fileToRoute(file);
    if (route === router.dataset.default || route !== router.dataset.fallback) {
      log(`Prerendering "${route}"`, logLevel.verbose);

      const [error, data] = await tryToCatch(
        readFile,
        join(options.path, file),
        "utf8"
      );
      if (error) {
        exit(500, error.message);
      } else if (typeof data === "string") {
        router.innerHTML = data;
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
              join(options.path, src),
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

      const dir = join(options.path, route);
      if (!existsSync(dir)) {
        log(`Creating directory "${dir}"`, logLevel.verbose);
        const [error0] = await tryToCatch(mkdir, dir, {
          recursive: true,
        });
        if (error0) {
          exit(500, error0.message);
        }
      }

      const [error1] = await tryToCatch(
        writeFile,
        join(dir, "index.html"),
        document.documentElement.outerHTML,
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
