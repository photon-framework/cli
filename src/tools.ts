import { readdirSync, statSync } from "fs";
import { join, parse, relative } from "path";
import { format } from "path/posix";
import { options } from "./cli";

export const systemToPosix = (path: string) => format(parse(path));

export function* filesIn(path: string): Generator<string> {
  path = join(options.path, path);
  const paths = readdirSync(path).map((x) => join(path, x));

  while (paths.length) {
    const absPath = paths.shift()!;

    const stat = statSync(absPath);

    if (stat.isDirectory()) {
      const add = readdirSync(absPath).map((x) => join(absPath, x));

      paths.push(...add);
    } else {
      const pathToYield = systemToPosix(relative(options.path, absPath));
      if (pathToYield[0] === "/") {
        yield pathToYield;
      } else {
        yield "/" + pathToYield;
      }
    }
  }
}
