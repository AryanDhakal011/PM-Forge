export type LandingScene = "hero" | "signal";

export function markLandingSceneReady(scene: LandingScene) {
  document.documentElement.dataset[`${scene}SceneReady`] = "true";
  window.dispatchEvent(
    new CustomEvent("pmforge:landing-scene-ready", { detail: scene }),
  );
}
