const router = ((window as any).router ??
  document.querySelector("*[photon-router]")) as HTMLElement & {
  dataset: {
    route?: string;
    content: string;
    default: string;
    fallback: string;
    homeAsEmpty?: boolean;
    langSegment?: string;
    languages?: string;
  };
};

(window as any).router = router;

router.dataset.route ??= router.dataset.default;
router.dataset.fallback ??= router.dataset.default;

if (!router) {
  throw new Error("No router found");
}

export { router };
