"use client";

import { useEffect, useState } from "react";

let cachedSupport: boolean | undefined;

export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
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
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.width = canvas.height = 0;
      setSupported(cachedSupport);
    } catch {
      cachedSupport = false;
      setSupported(false);
    }
  }, []);

  return supported;
}
