import { origin, serverUrl, started } from "./addInfo";
import { log, logLevel } from "./cli";
import { router } from "./router";
import { filesIn, fileToRoute } from "./tools";
import { document } from "./dom";

export const createSitemap = (): string => {
  const lastmod = started.toISOString().split("T")[0]!;
  const urls = document.createElement("urlset");
  urls.setAttribute("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9");

  if (router.dataset.homeAsEmpty) {
    log(`Adding "/" to sitemap.xml`, logLevel.verbose);
    const url = document.createElement("url");

    const locEl = document.createElement("loc");
    locEl.textContent = origin;
    url.appendChild(locEl);

    const lastmodEl = document.createElement("lastmod");
    lastmodEl.textContent = lastmod;
    url.appendChild(lastmodEl);

    const priorityEl = document.createElement("priority");
    priorityEl.textContent = "0.5";
    url.appendChild(priorityEl);

    urls.appendChild(url);
  }

  for (const file of filesIn("content")) {
    const routed = fileToRoute(file);

    if (
      routed === router.dataset.default ||
      routed !== router.dataset.fallback
    ) {
      log(`Adding "${routed}" to sitemap.xml`, logLevel.verbose);

      const url = document.createElement("url");

      const locEl = document.createElement("loc");
      locEl.textContent = serverUrl(routed);
      url.appendChild(locEl);

      const lastmodEl = document.createElement("lastmod");
      lastmodEl.textContent = lastmod;
      url.appendChild(lastmodEl);

      const priorityEl = document.createElement("priority");
      priorityEl.textContent = "0.5";
      url.appendChild(priorityEl);

      urls.appendChild(url);
    } else {
      log(`Skipping "${routed}" for sitemap.xml`, logLevel.verbose);
    }
  }

  return '<?xml version="1.0" encoding="UTF-8"?>' + urls.outerHTML + "\n";
};
