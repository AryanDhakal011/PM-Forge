const allowed = [
  /^\/app\/projects(?:\/[a-z0-9-]+)?(?:\/(?:run\/[a-z0-9-]+|c\/[1-3]))?$/,
  /^\/app\/projects\/debrief\/[a-z0-9-]+$/,
  /^\/app(?:\/(?:practice|progress|history|bookmarks|portfolio|settings|account))?$/,
  /^\/app\/practice\/[a-z0-9-]+$/,
  /^\/app\/run\/[a-z0-9-]+(?:\/debrief)?$/,
  /^\/app\/portfolio\/[a-z0-9-]+$/,
];
export function safeNext(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return "/app";
  try {
    const url = new URL(value, "https://pmforge.local");
    if (
      url.origin !== "https://pmforge.local" ||
      !allowed.some((re) => re.test(url.pathname))
    )
      return "/app";
    return url.pathname + url.search;
  } catch {
    return "/app";
  }
}
export const entryHref = (next = "/app", src = "entry", intent = "enter") =>
  `/signup?next=${encodeURIComponent(safeNext(next))}&src=${encodeURIComponent(src)}&intent=${encodeURIComponent(intent)}`;
