const [, , ...args] = process.argv;

import { statSync, existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { Parcel } from "@parcel/core";
import { parseDocument } from "htmlparser2";
import { findAll } from "domutils";
// import { Element, hasChildren, Node } from "domhandler";

const sourceIndex = resolve(
  (() => {
    for (const file of args) {
      if (existsSync(file)) {
        const stat = statSync(file);
        if (stat.isDirectory()) {
          return join(file, "index.html");
        } else if (stat.isFile()) {
          return file;
        }
      }
    }
    return undefined;
  })() ?? "./index.html"
);

console.info(`building "${sourceIndex}"…`);

const distDir = resolve("./dist");

const bundler = new Parcel({
  entries: [sourceIndex],
  defaultTargetOptions: {
    distDir: distDir,
    engines: {
      browsers: ["last 2 versions"],
    },
    isLibrary: false,
    outputFormat: "global",
    shouldOptimize: true,
    sourceMaps: false,
  },
  mode: "production",
  logLevel: "verbose",
  defaultConfig: "@parcel/config-default",
  shouldAutoInstall: true,
  shouldContentHash: true,
  env: {
    NODE_ENV: "production",
  },
});

bundler.run().then((ev) => {
  if (ev.type !== "buildSuccess") {
    console.error("Error", ev);
    process.exit(1);
  }

  console.info(`Parcel build completed in ${ev.buildTime}ms`);
  const dom = parseDocument(
    readFileSync(join(distDir, "index.html")).toString()
  );

  const nodes = dom.childNodes;

  const routers = findAll((el) => el.name === "photon:router", nodes);

  dom.cloneNode(true);
});
