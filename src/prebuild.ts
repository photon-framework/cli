import { promises as fs } from "fs";
import { extname, join, relative } from "path";
import { log, logLevel, options } from "./cli";
import * as git from "./prebuild_gitignore";
import { md } from "./prebuild_md";

export const prebuild = async () => {
  if (options.noPbs) {
    return;
  }

  log("Prebuilding");

  const dirList = [options.source];
  while (dirList.length > 0) {
    const dir = dirList.pop()!;
    const files = await fs.readdir(dir);
    for (const f of files) {
      const filePath = join(dir, f);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        dirList.unshift(filePath);
      } else {
        const ext = extname(filePath);
        const outFile =
          filePath.substring(0, filePath.length - ext.length) + ".html";

        let newContent: string | undefined;
        switch (ext) {
          case ".md":
            newContent = await md(await fs.readFile(filePath, "utf-8"));
            break;
        }

        if (newContent) {
          log(
            `Compiled "${relative(options.source, filePath)}" to "${relative(
              options.source,
              outFile
            )}"`,
            logLevel.verbose
          );
          git.ignore(outFile);
          await fs.writeFile(outFile, md(await fs.readFile(filePath, "utf-8")));
        }
      }
    }
  }

  await fs.writeFile(join(options.source, ".gitignore"), git.toString());
};
