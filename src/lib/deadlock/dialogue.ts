import { experience, line } from "./content";
/** Presentation variation never touches the deterministic decision log. */
export function selectReaction(
  pool: readonly string[],
  previous?: string,
  random = Math.random,
) {
  const candidates = pool.filter((id) => id !== previous);
  // A one-line speaker pool must not become empty when that speaker reacted last.
  const usable = candidates.length
    ? candidates
    : experience.match.Ines.filter((id) => id !== previous);
  const id =
    usable[Math.min(usable.length - 1, Math.floor(random() * usable.length))];
  line(id);
  return id;
}
