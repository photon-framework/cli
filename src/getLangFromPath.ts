import type { RouterOptions } from "./routerOptions";

export const getLangFromPath = (
  path: string,
  routerOptions: RouterOptions
): string | undefined => {
  if (
    Number.isNaN(routerOptions.langSegment) ||
    routerOptions.langSegment < 0
  ) {
    return undefined;
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length <= routerOptions.langSegment) {
    return undefined;
  }

  return segments[routerOptions.langSegment];
};
