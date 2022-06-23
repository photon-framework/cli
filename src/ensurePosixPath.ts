import { normalize } from "path/posix";

const winDiscRegex = /^[a-zA-Z]:\\?/;

export const ensurePosixPath = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path.replace("\\", "/");
  } else {
    if (winDiscRegex.test(path)) {
      path = path.replace(winDiscRegex, "/");
    }
    if (path.includes("\\")) {
      path = path.replace(/\\/g, "/");
    }
    return normalize(path);
  }
};
