import showdown from "showdown";

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

const converter = new showdown.Converter({
  noHeaderId: true,
  ghCodeBlocks: true,
  emoji: true,
  strikethrough: true,
  tables: true,
  underline: false,
  tasklists: true,
  extensions: ["heading", "anchor"],
});

export const md = converter.makeHtml.bind(converter);
