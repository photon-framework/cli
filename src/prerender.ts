import { log, logLevel, options } from "./cli";
import { filesIn, fileToRoute } from "./tools";
import { document } from "./dom";
import { router } from "./router";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";

export const prerender = async (): Promise<void> => {
  for (const file of filesIn("content")) {
    const route = fileToRoute(file);
    if (route === router.dataset.default || route !== router.dataset.fallback) {
      log(`Prerendering "${route}"`, logLevel.verbose);

      router.innerHTML = await readFile(join(options.path, file), "utf8");
      for (const script of Array.from(router.getElementsByTagName("script"))) {
        script.remove();
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
