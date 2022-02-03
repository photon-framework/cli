import { statSync, existsSync } from "fs";
import { join, resolve, dirname, basename, normalize } from "path";

export type sourceDirsObj = {
  sourceDir: string;
  sourceIndex: string;
  distDir: string;
  distIndex: string;
};

export const sourceDirs = (args: Array<string>): sourceDirsObj => {
  let sourceIndex: string | undefined = undefined;

  const sourceDir = normalize(
    resolve(
      (() => {
        for (const p of args) {
          if (existsSync(p)) {
            const stat = statSync(p);
            if (stat.isDirectory()) {
              return p;
            } else if (stat.isFile()) {
              sourceIndex = p;
              return dirname(p);
            }
          }
        }
        return undefined;
      })() ?? "./"
    )
  );

  sourceIndex ??= join(sourceDir, "index.html");

  const distDir = join(sourceDir, "../dist");

  const distIndex = join(distDir, basename(sourceIndex));

  return { sourceDir, sourceIndex, distDir, distIndex };
};
