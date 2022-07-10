import open from "open";

const windows = new Array<Window>();

export const openUri = (url: string) => {
  open(url);
};

export const closeAllWindows = () => {
  windows.forEach((window) => window.close());
};
