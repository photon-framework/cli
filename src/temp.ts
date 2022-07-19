import { existsSync, mkdir } from "fs";
import { rm } from "fs/promises";
import { resolve } from "path";

export const tempDir = new Promise<string>((res, rej) => {
  const now = Date.now().toString(36);
  const _tempDir = resolve(`./.photon-temp/${now}`);

  if (existsSync(_tempDir)) {
    res(_tempDir);
  } else {
    mkdir(_tempDir, { recursive: true }, (err) => {
      if (err) {
        rej(err);
      } else {
        res(_tempDir);
      }
    });
  }
});

export const cleanTemp = async () => rm(await tempDir, { recursive: true });
