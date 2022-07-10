import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { extname as extnamePosix } from "path/posix";
import { log, logLevel, options } from "./cli";
import { document } from "./dom";
import sizeOf from "image-size";
import type { ISizeCalculationResult } from "image-size/dist/types/interface";
import { router } from "./router";

export const webmanifest = async () => {
  log("Generating webmanifest");

  let manifestEl = document.querySelector(
    'link[rel="manifest"]'
  ) as HTMLLinkElement;

  if (!manifestEl) {
    log("No webmanifest found, creating one", logLevel.verbose);
    manifestEl = document.createElement("link");
    manifestEl.rel = "manifest";
    manifestEl.setAttribute("href", "/manifest.webmanifest");
    document.head.appendChild(manifestEl);
  }

  const manifestLocation = join(
    options.source,
    manifestEl.getAttribute("href")!
  );

  const manifest: Partial<WebManifest> = existsSync(manifestLocation)
    ? JSON.parse(await readFile(manifestLocation, "utf-8"))
    : {};

  const titleEl = document.querySelector("title") as HTMLTitleElement | null;
  if (titleEl && titleEl.textContent) {
    manifest.name ??= manifest.short_name ?? titleEl.textContent;
    manifest.short_name ??= titleEl.textContent.substring(0, 15);
  }

  const metaDescriptionEl = document.querySelector(
    'meta[name="description"]'
  ) as HTMLMetaElement | null;
  if (metaDescriptionEl && metaDescriptionEl.content) {
    manifest.description ??= metaDescriptionEl.content;
  }

  const metaThemeColorEl = document.querySelector(
    'meta[name="theme-color"]'
  ) as HTMLMetaElement | null;
  if (metaThemeColorEl && metaThemeColorEl.content) {
    manifest.theme_color ??= metaThemeColorEl.content;
    manifest.background_color ??= metaThemeColorEl.content;
  }

  manifest.icons ??= new Array();

  const iconsToAdd = new Array<{ src: string; type?: string }>();

  {
    const linkShortcutIconEl = document.querySelector(
      'link[rel="shortcut icon"]'
    ) as HTMLLinkElement | null;
    if (linkShortcutIconEl) {
      iconsToAdd.push({
        src: linkShortcutIconEl.getAttribute("href")!,
        type: linkShortcutIconEl.getAttribute("type")!,
      });
    }

    const linkAlternateIconEl = document.querySelector(
      'link[rel="alternate icon"]'
    ) as HTMLLinkElement | null;
    if (linkAlternateIconEl) {
      iconsToAdd.push({
        src: linkAlternateIconEl.getAttribute("href")!,
        type: linkAlternateIconEl.getAttribute("type")!,
      });
    }

    const linkAppleTouchIconEl = document.querySelector(
      'link[rel="apple-touch-icon"]'
    ) as HTMLLinkElement | null;
    if (linkAppleTouchIconEl) {
      iconsToAdd.push({
        src: linkAppleTouchIconEl.getAttribute("href")!,
        type: linkAppleTouchIconEl.getAttribute("type")!,
      });
    }
  }

  for (const iconToAdd of iconsToAdd) {
    let iconFound = false;
    for (const current of manifest.icons) {
      if (current.src === iconToAdd.src) {
        iconFound = true;
        break;
      }
    }

    if (iconFound) {
      continue;
    }

    const icon = {
      src: iconToAdd.src,
      sizes: formatImageDimensions(await getImageDimensions(iconToAdd.src)),
      type: iconToAdd.type ?? filenameToMimeType(iconToAdd.src),
    };
    manifest.icons.push(icon);
  }

  manifest.display ??= "browser";
  manifest.orientation ??= "any";
  manifest.scope ??= "/";
  manifest.start_url ??= "/";
  manifest.background_color ??= "#ffffff";
  manifest.theme_color ??= "#ffffff";

  if (!manifest.lang) {
    if (router.dataset.langSegment) {
      const langIndex = Number.parseInt(router.dataset.langSegment, 10);
      const lang = router.dataset.default.split("/").filter(Boolean)[langIndex];
      if (lang) {
        manifest.lang = lang;
      }
    } else if (document.documentElement.lang) {
      manifest.lang = document.documentElement.lang;
    }
  }

  manifest.dir ??= "auto";

  await writeFile(
    join(options.dist, manifestEl.getAttribute("href")!),
    JSON.stringify(manifest, null, 2)
  );
};

const filenameToMimeType = (filename: string): string => {
  const extension = extnamePosix(filename);
  if (extension === ".svg") {
    return "image/svg+xml";
  } else {
    return "image/" + extension.substring(1);
  }
};

const getImageDimensions = (file: string) =>
  new Promise<ISizeCalculationResult>((resolve, reject) => {
    const fullPath = join(options.dist, file);
    log(`Getting image dimensions for ${file}`, logLevel.verbose);
    sizeOf(fullPath, (e, r) => {
      if (e) {
        reject(e);
      } else if (r) {
        resolve(r);
      } else {
        reject(new Error("No dimensions found"));
      }
    });
  });

const formatImageDimensions = (dimensions: ISizeCalculationResult) =>
  `${dimensions.width}x${dimensions.height}`;

interface WebManifest {
  background_color: string;
  description: string;
  dir: "ltr" | "rtl" | "auto";
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  icons: Array<{
    src: string;
    sizes: string;
    type?: string;
  }>;
  lang: string;
  name: string;
  orientation:
    | "any"
    | "natural"
    | "landscape"
    | "landscape-primary"
    | "landscape-secondary"
    | "portrait"
    | "portrait-primary"
    | "portrait-secondary";
  prefer_related_applications?: boolean;
  related_applications?: {
    platform: "play" | "itunes" | "windows" | "google-play" | "windows-store";
    url: string;
  }[];
  scope: string;
  short_name: string;
  start_url: string;
  theme_color: string;
}
