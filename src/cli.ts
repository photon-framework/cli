import commandLineArgs from "command-line-args";
import Color from "cli-color";
import { appendFileSync, existsSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";
import { EOL } from "os";

const version = "1.0.0";

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
    Color.blackBright(`
Usage:
    $ photon-cli [options ...]

Options:
    ${highlight("--path")}    -p    Specify input directory
    ${highlight("--help")}    -h    Show this help message
    ${highlight("--version")} -v    Show version
`)
  );
};

const messageBuffer = new Array<{ throbber: string; list: string }>();
const throbber = ["–", "\\", "|", "/"];
let throbberIndex = 0;

const locale = Intl.DateTimeFormat().resolvedOptions().locale;
const logFilePath = resolve("./photon.log");
writeFileSync(
  logFilePath,
  new Date().toISOString() + "\tPhoton CLI log file" + EOL,
  "utf8"
);
const logFile = (message: string, channel: "INFO" | "WARNING" | "ERROR") => {
  const ts = new Date().toISOString();
  appendFileSync(logFilePath, `${ts}\t[${channel}]\t${message}${EOL}`, "utf8");
};

export const log = (message: string) => {
  crashGuard();
  logFile(message, "INFO");

  messageBuffer.push({
    list:
      Color.bgCyanBright.black(
        " " + new Date().toLocaleTimeString(locale) + " "
      ) +
      " " +
      Color.blackBright(message),

    throbber: Color.cyanBright(message),
  });
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

  if (code) {
    console.error(Color.bgRedBright.black.bold(` Error <${code}> ${message} `));
  } else if (message) {
    console.log(Color.bgGreenBright.black.bold(` ${message} `));
  }

  logFile(`Exiting with code ${code}: ${message || "no message"}`, "ERROR");

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
}, 200);

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
        name: "version",
        alias: "v",
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
})() as commandLineArgs.CommandLineOptions;

if (options.version) {
  console.log(`Photon CLI v${version}`);
  exit(0);
}

if (options.help) {
  help();
  exit();
}

if (!options.path) {
  help();
  exit(400, "No input directory specified, this option is required");
}

if (existsSync(options.path)) {
  const stat = statSync(options.path);
  if (stat.isDirectory()) {
    log(`Input directory "${resolve(options.path)}"`);
  } else {
    exit(401, `"${options.path}" is not a directory`);
  }
} else {
  exit(404, `Input directory "${options.path}" does not exist`);
}
