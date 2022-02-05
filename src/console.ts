import { EOL } from "os";

/** Console colors */
export const cc = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  /** Foreground */
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },

  /** Background */
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
};

export function error(message: string): void;
export function error(...message: Array<any>): void;
export function error(...message: Array<any>): void {
  process.stderr.write(
    [
      "🚨" + cc.fg.red + " ERROR: " + cc.reset,
      ...message.map(
        (m) =>
          cc.fg.red +
          (typeof m === "string" ? m : JSON.stringify(m, undefined, 2)) +
          cc.reset
      ),
    ].join(" ") + EOL
  );
  process.exit(1);
}

export function warn(message: string): void {
  console.warn(cc.fg.yellow + "! " + message + cc.reset);
}

export function log(message: string): void;
export function log(...message: Array<any>): void;
export function log(...message: Array<any>): void {
  process.stdout.write(
    [
      ...message.map((m) =>
        typeof m === "string" ? m : JSON.stringify(m, undefined, 2)
      ),
    ].join(" ") + EOL
  );
}
