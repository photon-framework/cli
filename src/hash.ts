import xxhash from "xxhash-wasm";

const xxhObjProm = xxhash();

export const hashToString = (input: string, seed?: bigint) =>
  new Promise<string>((resolve, reject) => {
    xxhObjProm
      .then((hasher) => {
        const hash = hasher.h64(input, seed);
        resolve(hash.toString(36));
      })
      .catch(reject);
  });
