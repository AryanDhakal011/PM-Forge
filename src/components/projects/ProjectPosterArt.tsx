import { projects } from "@/lib/projects/content";
import s from "./Projects.module.css";
// Each mission owns a small, authored diagram. SVG keeps all twelve posters
// crisp without allocating twelve renderers or a running animation per card.
const scenes = [
  "M10 55h160 M35 18v62 M35 30h70v36H35 M110 20h42v24h-42 M116 27h29M116 34h20 M125 57l14 14 23-29",
  "M18 20h140v65H18z M18 38h140 M57 20v65 M105 20v65 M28 49h19M67 49h28M115 49h31 M28 61h19M115 61h31 M68 69l8-11 10 6 11-16",
  "M8 73h164 M20 60h25v13H20z M65 60h25v13H65z M110 60h25v13h-25z M13 30h37v20H13z M67 25h37v25H67z M122 18h37v32h-37z M20 82h130",
  "M20 78V25h110v53H20z M37 60l20-8 24 10 27-34 M139 17l4 9 11 1-8 7 2 11-9-5-9 5 2-11-8-7 11-1z",
  "M5 53h35l12-22 11 43 14-35 13 14h25 M115 53l26-28h25 M115 53l26 28h25 M153 17l13 8-13 8 M153 73l13 8-13 8",
  "M14 24h150v58H14z M14 42h150 M58 24v58 M111 24v58 M86 8l-6 25 16 11-21 17 8 29 M20 32h30 M123 66h31",
  "M18 20h130v70H18z M37 37h78 M37 51h43 M37 65h67 M60 15l95 72 M145 35l18 17-26 26-18-17z",
  "M25 43a13 13 0 1 0 26 0a13 13 0 1 0-26 0 M124 43a13 13 0 1 0 26 0a13 13 0 1 0-26 0 M52 43h66 M58 32h54 M72 56h26 M20 15l4 9 M155 13l-6 9 M82 13l6 7 M35 72h21 M120 72h21",
  "M15 27c20-24 31 23 49 0s28 19 48 0 37 14 52 0 M15 49c20-24 31 23 49 0s28 19 48 0 37 14 52 0 M15 71c20-24 31 23 49 0s28 19 48 0 37 14 52 0 M82 18v63 M96 18v63",
  "M30 82a60 60 0 0 1 120 0 M45 82a45 45 0 0 1 90 0 M90 82l30-39 M24 88h134 M42 39l10 11 M88 18v14 M137 38l-10 11",
  "M18 18h140v69H18z M18 35h140 M88 12l-8 26 19 9-24 20 9 27 M120 44l22 34h-44z M120 56v8 M120 70v1",
  "M12 76h35l20-35h33l18 35h44 M24 14l-5 12 M49 13l-5 12 M74 14l-5 12 M99 13l-5 12 M124 14l-5 12 M149 13l-5 12 M32 81a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M133 81a5 5 0 1 0 10 0a5 5 0 1 0-10 0",
];
export default function ProjectPosterArt({ id }: { id: string }) {
  const i = Math.max(
    0,
    projects.findIndex((p) => p.id === id),
  );
  return (
    <svg
      viewBox="0 0 180 100"
      className={s.posterArt}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={scenes[i]} />
      <circle
        cx={14 + i * 12}
        cy="94"
        r="2"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
