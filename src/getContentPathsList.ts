import { readdirSync, statSync } from "fs";
import { join } from "path";
import { SourceDirsObj } from "./getDirs";

export const getContentPathsList = (dirs: SourceDirsObj) => {
  const contentPaths = new Set<string>();

  const searchPaths = [dirs.contentDir];
  while (searchPaths.length > 0) {
    const path = searchPaths.pop()!;
    const files = readdirSync(path);
    for (const file of files) {
      const filePath = join(path, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        searchPaths.push(filePath);
      } else if (stat.isFile()) {
        contentPaths.add(filePath);
      }
    }
  }

  return contentPaths;
};
