import { log, logLevel, options } from "./cli";
import { filesIn, fileToRoute } from "./tools";
import { document } from "./dom";
import { router } from "./router";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import Mustache from "mustache";
import { view } from "./view";

const refMap = new Map<string, string>();

export const prerender = async (): Promise<void> => {
  for (const file of filesIn("content")) {
    const route = fileToRoute(file);
    if (route === router.dataset.default || route !== router.dataset.fallback) {
      log(`Prerendering "${route}"`, logLevel.verbose);

      router.innerHTML = await readFile(join(options.path, file), "utf8");
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
            const ref = await readFile(join(options.path, src), "utf8");
            refMap.set(src, ref);
            return ref;
          }
        })();

        el.outerHTML = Mustache.render(refHtml, view.plus(el.dataset));
      }

      const dir = join(options.path, route);
      if (!existsSync(dir)) {
        log(`Creating directory "${dir}"`, logLevel.verbose);
        await mkdir(dir, {
          recursive: true,
        });
      }

      await writeFile(
        join(dir, "index.html"),
        document.documentElement.outerHTML,
        "utf8"
      );
    } else {
      log(`Skipping "${route}" for prerendering`, logLevel.verbose);
    }
  }
};
