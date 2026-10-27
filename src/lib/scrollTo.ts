type ScrollToOptions = {
  offset?: number;
  immediate?: boolean;
  duration?: number;
  easing?: (progress: number) => number;
  // Supported at runtime by Lenis but missing from its public option type.
  force?: boolean;
};

type ScrollInstance = {
  scrollTo: (target: number | string | Element, options?: ScrollToOptions) => void;
  resize: () => void;
  stop?: () => void;
  start?: () => void;
};

let instance: ScrollInstance | null = null;
let locked = false;

export function setScrollInstance(next: ScrollInstance | null) {
  instance = next;
  if (next && locked) next.stop?.();
}

/**
 * A single lock shared by the preloader and the dialogs. Setting it before
 * Lenis exists is safe: setScrollInstance applies the pending lock on boot.
 */
export function lockScroll(value: boolean) {
  locked = value;
  if (value) instance?.stop?.();
  else instance?.start?.();
}

export function isScrollLocked() {
  return locked;
}

export function scrollToSection(id: string, behavior?: ScrollBehavior) {
  const targetId = id === "top" ? "hero" : id;
  const element = document.getElementById(targetId);
  if (!element) return;

  const resolved = behavior ?? "smooth";
  const offset = targetId === "hero" ? 0 : -1;

  if (instance && resolved !== "auto") {
    instance.scrollTo(element, {
      offset,
      immediate: false,
      force: true,
    });
  } else {
    const top =
      element.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: resolved });
  }

  const hash = id === "top" ? "#top" : `#${id}`;
  window.history.replaceState(null, "", hash);
}

export function refreshScroll() {
  instance?.resize();
}

export function scrollToElement(
  target: string | Element,
  options: {
    offset?: number;
    duration?: number;
    easing?: (progress: number) => number;
    immediate?: boolean;
  } = {},
) {
  const element =
    typeof target === "string" ? document.getElementById(target) : target;
  if (!element) return;

  if (instance) {
    instance.scrollTo(element, {
      offset: options.offset ?? -96,
      duration: options.duration ?? 1.8,
      easing:
        options.easing ??
        ((progress) =>
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2),
      immediate: options.immediate ?? false,
      force: true,
    });
  } else {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function cancelSmoothScroll() {
  if (instance) {
    instance.scrollTo(window.scrollY, { immediate: true, force: true });
  }
}
