import "server-only";
import { providersConfigured } from "./server";

export function showcaseMode() {
  if (process.env.PMFORGE_SHOWCASE === "true") return true;
  if (process.env.PMFORGE_SHOWCASE === "false") return false;
  const { email, google, github } = providersConfigured();
  return !email && !google && !github;
}
