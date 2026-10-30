import gsap from "gsap";
export function projectEntrance(
  root: HTMLElement,
  category: string,
  onComplete: () => void,
) {
  const timeline = gsap.timeline({ onComplete });
  timeline.fromTo(
    root.querySelectorAll("[data-paper]"),
    { opacity: 0, y: 55, rotation: () => gsap.utils.random(-25, 25) },
    {
      opacity: 0.8,
      y: 0,
      rotation: 0,
      stagger: 0.09,
      duration: 1.2,
      ease: "power3.out",
    },
  );
  timeline.fromTo(
    root.querySelector("[data-pin]"),
    { scale: 0, y: -60 },
    { scale: 1, y: 0, duration: 0.65, ease: "back.out(1.4)" },
    0.8,
  );
  const nodes = root.querySelectorAll("[data-node]");
  timeline.fromTo(
    nodes,
    { opacity: 0.12, scale: 0.7 },
    {
      opacity: 1,
      scale: 1,
      stagger: 0.025,
      duration: 1.4,
      transformOrigin: "50% 50%",
    },
    1.6,
  );
  if (category === "root-cause")
    timeline.to(
      root.querySelectorAll("[data-fracture]"),
      { opacity: 0.95, strokeDashoffset: 0, stagger: 0.12, duration: 1.1 },
      3,
    );
  else if (category === "execution-metrics")
    timeline.to(
      nodes,
      {
        y: (i) => (i % 3 === 0 ? 30 : 0),
        opacity: (i) => (i % 3 === 0 ? 0.3 : 1),
        duration: 1,
      },
      3,
    );
  else if (category === "behavioral")
    timeline.to(nodes, { rotation: 0, x: 0, y: 0, duration: 1.2 }, 3);
  else
    timeline.to(
      nodes,
      {
        opacity: (i) => (i % 5 === 0 ? 0.3 : 1),
        scale: (i) => (i % 5 === 0 ? 1.2 : 1),
        duration: 1.2,
      },
      3,
    );
  timeline.fromTo(
    root.querySelector("[data-message]"),
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.8 },
    4.4,
  );
  timeline.to(root, { opacity: 0, duration: 0.55 }, 8);
  return timeline;
}
