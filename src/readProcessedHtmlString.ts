import { readFileSync, writeFileSync } from "fs";
import { yahp } from "@frank-mayer/yahp";

export const readProcessedHtmlString = async (file: string) => {
  const source = readFileSync(file).toString();
  const output = await yahp(source);
  writeFileSync(file, output);
  return output;
};
