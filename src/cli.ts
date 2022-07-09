import commandLineArgs from "command-line-args";
import Color from "cli-color";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { resolve, dirname, join } from "path";
import { EOL } from "os";

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
console.log(Color.blackBright(`Node.js: ${process.version}`));
console.log("");

const highlight = Color.bold.underline.whiteBright;

const help = () => {
  console.log(
    Color.blackBright(`Usage:
    $ photon-cli [options ...]

Options:
    ${highlight("--path")}          -p    Specify input directory
    ${highlight("--help")}          -h    Show this help message
    ${highlight("--verbose")}       -v    Verbose output
    ${highlight("--no-robots")}           Disable generation of robots.txt
    ${highlight("--no-sitemap")}          Disable generation of sitemap.xml
`)
  );
};

const messageBuffer = new Array<{ throbber: string; list: string }>();
const throbber = (() => {
  const a = ["|", "/", "-", "\\"];
  const b = new Array<string>();
  for (let i = 0; i < a.length; i++) {
    b.push(a[i]!);
    b.push(a[i]!);
    b.push(a[i]!);
    b.push(a[i]!);
  }
  return b;
})();
let throbberIndex = 0;

const locale = Intl.DateTimeFormat().resolvedOptions().locale;
const logFilePath = resolve("./photon.log");
{
  const [, , ...args] = process.argv;
  writeFileSync(
    logFilePath,
    new Date().toISOString() + "\t[INFO]  \tphoton-cli " + args.join(" ") + EOL,
    "utf8"
  );
}

const logFile = (message: string, channel: string) => {
  if (channel === logLevel.verbose && !options.verbose) {
    return;
  }

  const ts = new Date().toISOString();
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

export const log = (message: string, channel: logLevel = logLevel.info) => {
  crashGuard();
  logFile(message, channel);

  switch (channel) {
    case logLevel.info:
      messageBuffer.push({
        list:
          Color.bgCyan.black(
            " " + new Date().toLocaleTimeString(locale) + " "
          ) +
          " " +
          Color.blackBright(message),

        throbber: Color.cyanBright(message),
      });
      break;

    case logLevel.verbose:
      if (options.verbose) {
        messageBuffer.push({
          list:
            Color.bgBlackBright.black(
              " " + new Date().toLocaleTimeString(locale) + " "
            ) +
            " " +
            Color.blackBright(message),

          throbber: Color.cyanBright(message),
        });
      }
      break;

    case logLevel.warn:
      messageBuffer.push({
        list:
          Color.bgYellowBright.black(
            " " + new Date().toLocaleTimeString(locale) + " "
          ) +
          " " +
          Color.yellowBright(message),

        throbber: Color.yellowBright(message),
      });
      break;

    case logLevel.error:
      messageBuffer.push({
        list:
          Color.bgRedBright.black(
            " " + new Date().toLocaleTimeString(locale) + " "
          ) +
          " " +
          Color.redBright(message),

        throbber: Color.redBright(message),
      });
      break;
  }
};

export const exit = (code: number = 0, message: string = "") => {
  clearInterval(throbberInterval);
  if (crashGuardId) {
    clearInterval(crashGuardId);
  }

  process.stdout.write("\x1b[2K\x1b[0G");

  while (messageBuffer.length) {
    console.log(messageBuffer.shift()!.list);
  }

  {
    const uptime = process.uptime().toFixed(2);
    console.log(
      EOL + Color.yellowBright(`✨ Took ${uptime} seconds to complete`)
    );
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

let crashGuardId: NodeJS.Timeout | number | undefined;
const crashGuard = () => {
  if (crashGuardId) {
    clearInterval(crashGuardId);
    crashGuardId = undefined;
  }

  crashGuardId = setTimeout(() => {
    exit(500, "Crash guard triggered (no response)");
  }, 5000);
};

const throbberInterval = setInterval(() => {
  throbberIndex = (throbberIndex + 1) % throbber.length;

  process.stdout.write("\x1b[2K\x1b[0G");

  while (messageBuffer.length > 1) {
    console.log(messageBuffer.shift()!.list);
  }

  const throbberStr = Color.magenta(throbber[throbberIndex]!);

  if (messageBuffer.length !== 0) {
    process.stdout.write(throbberStr + " " + messageBuffer[0]!.throbber);
  } else {
    process.stdout.write(throbberStr);
  }
}, 50);

export const options = (() => {
  try {
    const options = commandLineArgs([
      {
        name: "path",
        alias: "p",
        lazyMultiple: false,
        multiple: false,
        type: String,
        defaultOption: true,
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
    ]);

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
  path: string;
  help: boolean;
  verbose: boolean;
  "no-robots": boolean;
  "no-sitemap": boolean;
}>;

if (options.help) {
  help();
  exit();
} else if (!options.path) {
  help();
  exit(400, "No input directory specified, this option is required");
} else {
  (options as any).path = resolve(options.path);

  if (existsSync(options.path)) {
    const stat = statSync(options.path);
    if (stat.isDirectory()) {
      log(`Input directory "${options.path}"`);
    } else {
      exit(401, `"${options.path}" is not a directory`);
    }
  } else {
    exit(404, `Input directory "${options.path}" does not exist`);
  }
}
