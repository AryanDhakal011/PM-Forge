"use client";

import { useEffect, useState } from "react";

let cachedSupport: boolean | undefined;

export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 767px)");
    const probe = () => {
      // The compact layout uses illustrations. Even a capability probe can
      // initialise an expensive GPU process, so do not create a mobile context.
      if (compact.matches) {
        setSupported(false);
        return;
      }
      if (cachedSupport !== undefined) {
        setSupported(cachedSupport);
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        // Three's current renderer requires WebGL2. A capability probe must not
        // retain a second GPU context every time a scene is visited.
        const gl = canvas.getContext("webgl2");
        cachedSupport = Boolean(gl);
        // Software WebGL can advertise support while shader compilation blocks
        // the main thread for seconds. Keep the illustrated scene on these
        // devices; accelerated GPUs retain the complete interactive composition.
        const debug = gl?.getExtension("WEBGL_debug_renderer_info");
        const renderer = debug
          ? String(gl?.getParameter(debug.UNMASKED_RENDERER_WEBGL))
          : "";
        if (
          /swiftshader|llvmpipe|softpipe|software rasterizer|microsoft basic render/i.test(
            renderer,
          )
        ) {
          cachedSupport = false;
        }
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.width = canvas.height = 0;
        setSupported(cachedSupport);
      } catch {
        cachedSupport = false;
        setSupported(false);
      }
    };
    probe();
    compact.addEventListener("change", probe);
    return () => compact.removeEventListener("change", probe);
  }, []);

  return supported;
}
