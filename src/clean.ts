import { existsSync } from "fs";
import { readdir, stat, unlink } from "fs/promises";
import { join } from "path";
import tryToCatch from "try-to-catch";
import { exit, log, logLevel, options } from "./cli";

export const clean = async () => {
  if (existsSync(options.dist)) {
    log(`Cleaning "${options.dist}"`, logLevel.info);
    const cleanDirs = [options.dist];
    while (cleanDirs.length !== 0) {
      const dir = cleanDirs.shift()!;
      for (const el of await readdir(dir)) {
        const fullPath = join(dir, el);
        const [statErr, elStat] = await tryToCatch(stat, fullPath);
        if (statErr) {
          exit(500, statErr);
        }
        if (elStat!.isDirectory()) {
          log(`Cleaning subdirectory "${fullPath}"`, logLevel.verbose);
          cleanDirs.push(fullPath);
        } else {
          log(`Deleteing file "${fullPath}"`, logLevel.verbose);
          const [unlinkErr] = await tryToCatch(unlink, fullPath);
          if (unlinkErr) {
            if (el === "index.html") {
              exit(500, unlinkErr);
            } else {
              log(unlinkErr.message, logLevel.warn);
            }
          }
        }
      }
    }
  } else {
    log(
      `Directory "${options.dist}" does not exist, nothing to clean`,
      logLevel.info
    );
  }
};
