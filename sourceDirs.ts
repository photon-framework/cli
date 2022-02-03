import { statSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve, dirname, basename, normalize } from "path";
import { EOL } from "os";

export type sourceDirsObj = {
  sourceDir: string;
  sourceIndex: string;
  distDir: string;
  distIndex: string;
  cacheDir: string;
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

  const dotPhoton = join(distDir, "../photon");
  if (!existsSync(dotPhoton)) {
    mkdirSync(dotPhoton, { recursive: true });
  }
  writeFileSync(join(dotPhoton, ".gitignore"), "*" + EOL);

  return {
    sourceDir,
    sourceIndex,
    distDir,
    distIndex,
    cacheDir: join(dotPhoton, "cache"),
  };
};
