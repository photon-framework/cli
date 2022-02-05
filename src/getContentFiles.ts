import { readdirSync, statSync } from "fs";
import { join } from "path";

export const getContentFiles = (contentDir: string) => {
  const contentFiles = new Set<string>();

  const paths = readdirSync(contentDir).map((p) => join(contentDir, p));

  while (paths.length !== 0) {
    const path = paths.pop()!;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      paths.push(...readdirSync(path).map((p) => join(path, p)));
    } else if (stat.isFile() && path.endsWith(".html")) {
      contentFiles.add(path);
    }
  }

  return contentFiles;
};
