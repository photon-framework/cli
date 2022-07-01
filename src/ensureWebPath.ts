const { URL } = require("url");
const { normalize } = require("path/posix");

export const ensureWebPath = (path: string) => {
  if (path) {
    if (path.search(/^[a-zA-Z]+:[\\/]+/) !== -1) {
      console.debug(`"${path}" has a scheme`);
      const url = new URL(path);
      url.pathname = normalize(url.pathname);
      return url.href;
    } else {
      console.debug(`"${path}" has no scheme`);
      return normalize(path);
    }
  } else {
    return "./";
  }
};
