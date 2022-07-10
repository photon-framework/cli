import { readdirSync, statSync } from "fs";
import { join, parse, relative } from "path";
import { format } from "path/posix";
import { options } from "./cli";

export const systemToPosix = (path: string) => format(parse(path));

export function filesIn(path: string): Iterable<string> {
  const y = new Array<string>();

  path = join(options.dist, path);
  const paths = readdirSync(path).map((x) => join(path, x));

  while (paths.length !== 0) {
    const absPath = paths.shift()!;
    const stat = statSync(absPath);

    if (stat.isDirectory()) {
      const add = readdirSync(absPath).map((x) => join(absPath, x));
      paths.push(...add);
    } else {
      const pathToYield = systemToPosix(relative(options.dist, absPath));

      if (pathToYield[0] === "/") {
        y.push(pathToYield);
      } else {
        y.push("/" + pathToYield);
      }
    }
  }

  return y;
}

export const fileToRoute = (file: string) => {
  const splittet = file.split("/").filter(Boolean);
  const lastIndex = splittet.length - 1;
  splittet[lastIndex] = splittet[lastIndex]!.substring(
    0,
    splittet[lastIndex]!.lastIndexOf(".")
  );
  splittet.shift();

  return "/" + splittet.join("/");
};
