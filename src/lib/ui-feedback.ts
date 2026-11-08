export function showError(message:string) {
  if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("pmforge:error",{detail:{message}}));
}
export function friendlyRequestError(error:unknown, action="The request") {
  const name=(error as {name?:string})?.name;
  if(name==="TimeoutError"||name==="AbortError")return `${action} timed out. Please retry. No extra AI call will be made automatically.`;
  if(error instanceof TypeError)return `${action} could not connect. Check your connection and retry.`;
  return error instanceof Error ? error.message : `${action} could not finish. Please retry.`;
}

/** Adapter for older screens whose action failures use role=status rather than role=alert. */
export function isFailureMessage(text:string){return /could not|cannot |unable to|\bfailed\b|timed out|not a valid|permission.{0,30}denied|storage protection unavailable|copy blocked|over the .{0,12}import limit|needs a fresh sign-in|did not (?:start|finish|play)|voice typing could not/i.test(text)}
