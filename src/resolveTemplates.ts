import { NodeWithChildren } from "domhandler";
import { findAll, replaceElement } from "domutils";
import { parseDocument } from "htmlparser2";
import { join, normalize } from "path";
import { readProcessedHtmlString } from "./readProcessedHtmlString";

const placeholder = new RegExp("\\{\\{([^\\{\\}]+)\\}\\}", "g");

export const templateCache = new Map<string, string>();

const loadTemplate = async (file: string): Promise<string> => {
  file = normalize(file);

  if (templateCache.has(file)) {
    return templateCache.get(file)!;
  }

  const template = await readProcessedHtmlString(file);
  templateCache.set(file, template);
  return template;
};

export const resolveTemplates = async <TNode extends NodeWithChildren>(
  node: TNode,
  rootPath: string
): Promise<TNode> => {
  const photonRefElements = findAll(
    (el) => el.name === "photon-ref" && "src" in el.attribs,
    node.childNodes
  );

  for (const photonRefEl of photonRefElements) {
    const dataset = new Map<string, string>();
    for (const key in photonRefEl.attribs) {
      if (key.startsWith("data-")) {
        dataset.set(key.substring(5), photonRefEl.attribs[key]!);
      }
    }

    const html = await loadTemplate(
      join(rootPath, photonRefEl.attribs["src"]!)
    );

    replaceElement(
      photonRefEl,
      parseDocument(
        html.replace(placeholder, (match) => {
          const key = match.substring(2, match.length - 2);

          if (dataset.has(key)) {
            return dataset.get(key)!;
          }

          console.warn(
            `Missing data-key "${key}" for "${photonRefEl.attribs.src}"`
          );
          return "";
        })
      )
    );
  }

  return node;
};
