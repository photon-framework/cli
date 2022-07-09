import commandLineArgs from "command-line-args";
import Color from "cli-color";
import { existsSync, statSync } from "fs";
import { resolve } from "path";

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
    ${highlight("--path")}   -p      Specify input directory
    ${highlight("--help")}   -h      Show this help message
`)
  );
};

let messageBuffer = "";
let lasstMessageBuffer = "";
let messageTime = new Array<string>();
const throbber = ["–", "\\", "|", "/"];
let throbberIndex = 0;

export const log = (message: string) => {
  crashGuard();

  messageTime.push(
    " " +
      new Date().toLocaleTimeString(
        Intl.DateTimeFormat().resolvedOptions().locale
      ) +
      " "
  );

  if (messageBuffer) {
    lasstMessageBuffer = messageBuffer;
  }

  messageBuffer = message.substring(
    0,
    Math.min(message.length, Color.windowSize.width - 2)
  );
};

export const exit = (code: number = 0, message: string = ""): never => {
  clearInterval(throbberInterval);
  process.stdout.write("\x1b[2K\x1b[0G");

  if (messageBuffer) {
    process.stdout.write(Color.bgCyanBright.black(messageTime.shift()));
    process.stdout.write(" " + Color.cyanBright(messageBuffer) + "\r\n");
  }

  if (code) {
    process.stderr.write(
      Color.bgRedBright.black.bold(` Error <${code}> ${message} \r\n`)
    );
  } else if (message) {
    process.stdout.write(Color.bgGreenBright.black.bold(` ${message} \r\n`));
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
  }, 30000);
};

const throbberInterval = setInterval(() => {
  throbberIndex = (throbberIndex + 1) % throbber.length;

  process.stdout.write("\x1b[2K\x1b[0G");

  if (lasstMessageBuffer) {
    process.stdout.write(Color.bgCyanBright.black(messageTime.shift()));
    process.stdout.write(" " + Color.cyanBright(lasstMessageBuffer) + "\r\n");

    lasstMessageBuffer = "";
  }

  process.stdout.write(Color.cyanBright(throbber[throbberIndex]!));

  if (messageBuffer) {
    process.stdout.write(" " + Color.blackBright(messageBuffer));
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
