import { document } from "./dom";

const router = document.querySelector("*[photon-router]") as HTMLElement & {
  dataset: {
    readonly content: string;
    readonly default: string;
    readonly fallback: string;
    readonly homeAsEmpty?: boolean;
    readonly langSegment?: string;
    languages?: string;
    preload?: string;
  };
};

router.dataset.route ??= router.dataset.default;
(router.dataset as any).fallback ??= router.dataset.default;

if (!router) {
  throw new Error("No router found");
}

export { router };
