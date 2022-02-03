import { readdirSync, statSync, rmSync, unlinkSync } from "fs";
import { join } from "path";

export const clearDirectory = (path: string) => {
  for (const file of readdirSync(path)) {
    const filePath = join(path, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      rmSync(filePath, { recursive: true });
    } else {
      unlinkSync(filePath);
    }
  }
};
