import { log, logLevel } from "./cli";
import { router } from "./router";
import { filesIn, fileToRoute } from "./tools";

export const addPreload = () => {
  log("Adding preload paths", logLevel.info);

  const preload = new Array<string>();

  const languages = new Set<string>();
  const langSegment = Number.parseInt(router.dataset.langSegment ?? "-1", 10);
  const doLang = !Number.isNaN(langSegment) && langSegment >= 0;

  for (const file of filesIn(router.dataset.content)) {
    const route = fileToRoute(file);

    if (route === router.dataset.default || route !== router.dataset.fallback) {
      preload.push(route);

      if (doLang) {
        const lang = route.split("/").filter(Boolean)[langSegment];
        if (lang) {
          languages.add(lang);
        }
      }
    }
  }

  router.dataset.preload = JSON.stringify(preload);

  if (doLang) {
    router.dataset.languages = JSON.stringify(Array.from(languages));
  }
};
