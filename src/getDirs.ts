import { statSync, existsSync } from "fs";
import { join, resolve, dirname, normalize } from "path";

export type SourceDirsObj = Readonly<{
  distDir: string;
  distIndex: string;
  contentDir: string;
}>;

export const getDirs = (args: Iterable<string>): SourceDirsObj => {
  let distIndex: string | undefined = undefined;

  const distDir = normalize(
    resolve(
      (() => {
        for (const a of args) {
          if (existsSync(a)) {
            const stat = statSync(a);
            if (stat.isDirectory()) {
              return a;
            } else if (stat.isFile()) {
              distIndex = a;
              return dirname(a);
            }
          }
        }
        return undefined;
      })() ?? "./"
    )
  );

  distIndex ??= join(distDir, "index.html");

  return Object.freeze({
    distDir,
    distIndex,
    contentDir: join(distDir, "content"),
  });
};
