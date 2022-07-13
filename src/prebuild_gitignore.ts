import { systemToPosix } from "./tools";
import { relative } from "path";
import { options } from "./cli";

const gitignore = ["# this file is auto-generated", "# do not edit manually!"];

export const ignore = (path: string) => {
  gitignore.push(systemToPosix(relative(options.source, path)));
};

export const toString = () => gitignore.join("\n") + "\n";
