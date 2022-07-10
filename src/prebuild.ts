import { promises as fs } from "fs";
import { join, relative, extname } from "path";
import showdown from "showdown";
import { log, logLevel, options } from "./cli";
import { systemToPosix } from "./tools";

// h1 role heading
showdown.extension("heading", () => ({
  type: "output",
  regex: /<h1>/,
  replace: '<h1 role="heading">',
}));

// a href and data-route
showdown.extension("anchor", () => ({
  type: "output",
  regex: /<a href="(.*?)">/gi,
  replace: (def: string, href: string) => {
    if (href.startsWith("https://") || href.startsWith("http://")) {
      return `<a href="${href}" target="_blank">`;
    } else {
      return def;
    }
  },
}));

const md = new showdown.Converter({
  noHeaderId: true,
  emoji: true,
  strikethrough: true,
  tables: true,
  underline: true,
  tasklists: true,
  extensions: ["heading", "anchor"],
});

export const prebuild = async () => {
  if (options.noPbs) {
    return;
  }

  log("Prebuilding");

  const gitignore = [
    "# this file is auto-generated",
    "# do not edit manually!",
  ];

  const ignore = (path: string) => {
    gitignore.push(systemToPosix(relative(options.source, path)));
  };

  const dirList = [options.source];
  while (dirList.length > 0) {
    const dir = dirList.pop()!;
    const files = await fs.readdir(dir);
    for (const f of files) {
      const filePath = join(dir, f);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        dirList.push(filePath);
      } else {
        const ext = extname(filePath);
        if (ext === ".md") {
          log(
            `Compiling ${relative(options.source, filePath)}`,
            logLevel.verbose
          );

          const outFile = filePath.substring(0, filePath.length - 2) + "html";
          ignore(outFile);
          await fs.writeFile(
            outFile,
            md.makeHtml(await fs.readFile(filePath, "utf-8"))
          );
        }
      }
    }
  }

  await fs.writeFile(join(options.source, ".gitignore"), gitignore.join("\n"));
};
