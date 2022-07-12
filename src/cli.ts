import commandLineArgs from "command-line-args";
import Color from "cli-color";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { resolve, dirname } from "path";
import { EOL } from "os";
import { closeAllWindows } from "./windows";

console.log(
  Color.magentaBright(`
    ___       ___       ___       ___       ___       ___
   /\\  \\     /\\__\\     /\\  \\     /\\  \\     /\\  \\     /\\__\\
  /::\\  \\   /:/__/_   /::\\  \\    \\:\\  \\   /::\\  \\   /:| _|_
 /::\\:\\__\\ /::\\/\\__\\ /:/\\:\\__\\   /::\\__\\ /:/\\:\\__\\ /::|/\\__\\
 \\/\\::/  / \\/\\::/  / \\:\\/:/  /  /:/\\/__/ \\:\\/:/  / \\/|::/  /
    \\/__/    /:/  /   \\::/  /   \\/__/     \\::/  /    |:/  /
             \\/__/     \\/__/               \\/__/     \\/__/
`)
);

const highlight = Color.bold.underline.whiteBright;

const help = () => {
  console.log(
    Color.blackBright(`Usage:
    $ photon-cli [options ...]

Options:
    ${highlight("--path")}          -p    Specify input directory
    ${highlight("--source")}        -s    Specify source directory
    ${highlight(
      "--serve"
    )}               Specify a port to host the app and watch for changes
    ${highlight("--help")}          -h    Show this help message
    ${highlight("--verbose")}       -v    Verbose output
    ${highlight("--no-robots")}           Disable generation of robots.txt
    ${highlight(
      "--no-pbs"
    )}                Disable pre build steps (like Markdown)
    ${highlight("--no-sitemap")}          Disable generation of sitemap.xml
    ${highlight("--no-minify")}           Disable minification of files
`)
  );
};

const now = () => {
  const d = new Date();

  return [
    d.getHours().toString().padStart(2, "0"),
    d.getMinutes().toString().padStart(2, "0"),
    d.getSeconds().toString().padStart(2, "0"),
    d.getMilliseconds().toString().padStart(4, "0"),
  ].join(":");
};

const logFilePath = resolve("./photon.log");
{
  const [, , ...args] = process.argv;
  writeFileSync(
    logFilePath,
    now() + "\t[INFO]  \t$ photon " + args.join(" ") + EOL,
    "utf8"
  );
}

const logFile = (message: string, channel: string) => {
  if (channel === logLevel.verbose && !options.verbose) {
    return;
  }

  const ts = now();
  const channelDisplay = `[${channel}]`.padEnd(9);
  appendFileSync(
    logFilePath,
    `${ts}\t${channelDisplay}\t${message}${EOL}`,
    "utf8"
  );
};

export enum logLevel {
  verbose = "VERBOSE",
  info = "INFO",
  warn = "WARNING",
  error = "ERROR",
}

const clear = "\x1b[2K\x1b[0G";

export const log = (message: string, channel: logLevel = logLevel.info) => {
  crashGuard();
  logFile(message, channel);

  switch (channel) {
    case logLevel.info:
      console.log(
        clear +
          Color.bgCyan.black(" " + now() + " ") +
          " " +
          Color.blackBright(message)
      );
      break;

    case logLevel.verbose:
      if (options.verbose) {
        console.debug(
          clear +
            Color.bgBlackBright.black(" " + now() + " ") +
            " " +
            Color.blackBright(message)
        );
      }
      break;

    case logLevel.warn:
      console.warn(
        clear +
          Color.bgYellowBright.black(" " + now() + " ") +
          " " +
          Color.yellowBright(message)
      );
      break;

    case logLevel.error:
      console.error(
        clear +
          Color.bgRedBright.black(" " + now() + " ") +
          " " +
          Color.redBright(message)
      );
      break;
  }
};

const throbber = Color.throbber(
  (str) => {
    process.stdout.write(str);
  },
  250,
  (str) => Color.magenta(str)
);
throbber.start();

export const exit = (code: number = 0, message: string | Error = "") => {
  throbber.stop();
  if (crashGuardId) {
    clearInterval(crashGuardId);
  }
  closeAllWindows();

  console.log(clear);

  if (typeof message === "object") {
    if ("message" in message) {
      message = message.message;
    } else {
      message = (message as any).toString();
    }
  }

  if (code) {
    message ||= "no message";
    console.error(Color.bgRed.black.bold(` Error <${code}> ${message} `));
    logFile(`Exiting with code ${code}: ${message}`, logLevel.error);
  } else {
    message ||= "Success";
    console.log(Color.bgGreen.black.bold(` ${message} `));
    logFile(`Exiting with code ${code}: ${message}`, logLevel.info);
  }

  process.exit(code);
};

process.on("SIGINT", function () {
  exit(0, "User interrupted");
});

let crashGuardId: NodeJS.Timeout | number | undefined = undefined;
let crashGuard = () => {
  if (crashGuardId) {
    clearInterval(crashGuardId);
    crashGuardId = undefined;
  }

  if (crashGuardId !== -1) {
    crashGuardId = setTimeout(() => {
      exit(500, "Crash guard triggered (no response)");
    }, 30000);
  }
};
export const stopCrashGuard = () => {
  crashGuard = () => {};

  if (crashGuardId) {
    clearInterval(crashGuardId);
  }
};

export const options = (() => {
  try {
    const options = commandLineArgs(
      [
        {
          name: "source",
          alias: "s",
          lazyMultiple: false,
          multiple: false,
          type: String,
          defaultOption: true,
        },
        {
          name: "serve",
          lazyMultiple: false,
          multiple: false,
          type: Number,
          defaultValue: false,
        },
        {
          name: "help",
          alias: "h",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
        {
          name: "verbose",
          alias: "v",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
        {
          name: "no-robots",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
        {
          name: "no-sitemap",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
        {
          name: "no-minify",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
        {
          name: "no-pbs",
          lazyMultiple: false,
          multiple: false,
          type: Boolean,
          defaultValue: false,
        },
      ],
      {
        stopAtFirstUnknown: true,
        camelCase: true,
        caseInsensitive: true,
        partial: false,
      }
    );

    return options;
  } catch (e) {
    if ((e as Error).name === "UNKNOWN_OPTION") {
      help();
    }

    if ("message" in (e as Error)) {
      exit(400, (e as Error).message);
    } else {
      exit(400, e + "");
    }

    return {};
  }
})() as Readonly<{
  dist: string;
  source: string;
  serve: number;
  help: boolean;
  verbose: boolean;
  noRobots: boolean;
  noSitemap: boolean;
  noMinify: boolean;
  noPbs: boolean;
}>;

const artifactPath = process.argv[1];

if (artifactPath && existsSync(artifactPath)) {
  console.log(Color.blackBright(`Artifact: ${artifactPath}`));

  const dname = dirname(artifactPath);

  const packageJsonPath = dname.endsWith(".bin")
    ? resolve(dname, "../photon-cli/package.json")
    : resolve(dname, "package.json");

  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    if ("version" in packageJson) {
      console.log(Color.blackBright(`Photon CLI v${packageJson.version}`));
    }
  }
}

if (options.verbose) {
  for (const k in process.versions) {
    if (process.versions.hasOwnProperty(k)) {
      const display = k[0]!.toUpperCase() + k.substring(1);
      console.log(Color.blackBright(`${display}: ${process.versions[k]}`));
    }
  }
}
console.log("");

if (options.help) {
  help();
  exit();
} else if (
  typeof options.serve === "number" &&
  !isNaN(options.serve) &&
  options.serve < 1
) {
  exit(401, `Port ${options.serve} is not valid`);
} else {
  const stat = statSync(options.source);
  if (stat.isDirectory()) {
    log(`Input directory "${options.source}"`);

    (options as any).dist = resolve(options.source, "../dist/");
    log(`Output directory "${options.dist}"`);
  } else {
    exit(401, `"${options.source}" is not a directory`);
  }
}
