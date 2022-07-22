import { existsSync } from "fs";
import { stat } from "fs/promises";
import { join } from "path";
import { log, logLevel, options } from "./cli";
import { router } from "./router";
import { filesIn, fileToRoute } from "./tools";

export const addPreload = async () => {
  log("Adding preload paths", logLevel.info);

  const preload = new Array<string>();

  const languages = new Set<string>();
  const langSegment = Number.parseInt(router.dataset.langSegment ?? "-1", 10);
  const doLang = !Number.isNaN(langSegment) && langSegment >= 0;

  for (const file of filesIn(router.dataset.content)) {
    const route = fileToRoute(file);

    if (
      file.endsWith(".html") &&
      (route === router.dataset.default || route !== router.dataset.fallback)
    ) {
      preload.push(route);

      if (doLang) {
        const lang = route.split("/").filter(Boolean)[langSegment];
        if (lang) {
          const langPath = join(options.dist, router.dataset.content, lang);
          if (existsSync(langPath)) {
            const langStat = await stat(langPath);
            if (langStat.isDirectory()) {
              languages.add(lang);
            }
          }
        }
      }
    }
  }

  router.dataset.preload = JSON.stringify(preload);

  if (doLang) {
    router.dataset.languages = JSON.stringify(Array.from(languages));
  }
};
