import { content, type State, type Action } from "./engine";
export type ConversationPlan = {
  key: string;
  title: string;
  ids: string[];
  task: string;
  finish: string;
  reply?: boolean;
};
export function conversationPreferences(prefs: Record<string, unknown>) {
  return {
    guides: prefs.conversationVersion === 2 ? prefs.guides !== false : true,
    autoPlay: prefs.conversationVersion === 2 && prefs.autoPlay === true,
  };
}
export function conversationFor(
  state: State,
  action?: Action,
  guides = true,
): Omit<ConversationPlan, "key"> {
  const guide = content.conversations[state.scene];
  let ids: string[] = [];
  if (!action)
    ids = state.scene === "cold" ? guide.lines : guides ? guide.lines : [];
  else if (action.type === "LINK") {
    const e = content.evidence.find((e) => e.id === action.id)!;
    ids = [
      e.supports.includes(action.claim)
        ? "G-LINK-SUPPORT"
        : e.breaks.includes(action.claim)
          ? "G-LINK-BREAK"
          : "G-LINK-MISS",
    ];
  } else if (action.type === "CALL")
    ids = [
      state.lastLine,
      state.plan === "ship"
        ? "PRIYA-IGNORED"
        : state.strong
          ? "PRIYA-LISTENED"
          : "PRIYA-NEUTRAL",
      ...(guides ? ["G-MORNING"] : []),
    ];
  else if (action.type === "DEMO")
    ids = [
      state.lastLine,
      state.golden
        ? "BOARD-GOLD"
        : ["crash", "payments", "marlo"].includes(state.demo || "")
          ? "BOARD-FAIL"
          : ["stable", "degraded"].includes(state.demo || "")
            ? "BOARD-STABLE"
            : "BOARD-OPEN",
      ...(state.deals.length
        ? ["BOARD-LEDGER"]
        : !state.queue
          ? ["BOARD-WARNING"]
          : []),
    ];
  else if (action.type === "FINAL")
    ids = [
      action.move === "own"
        ? "FINAL-OWN"
        : action.move === "defend"
          ? "FINAL-DEFEND"
          : "FINAL-ROLLBACK",
      state.lastLine,
      ...(guides ? ["G-DEBRIEF"] : []),
    ];
  else if (action.type === "NEXT") ids = guides ? guide.lines : [];
  else if (action.type === "REPLY")
    ids = [
      state.lastLine,
      ...(guides ? content.conversations.evidence.lines : []),
    ];
  else if (action.type === "INSPECT")
    ids = [state.lastLine, ...(guides ? ["G-LINK"] : [])];
  else if (action.type === "ALLOCATE")
    ids = [
      state.lastLine,
      ...(guides ? content.conversations.rehearsal.lines : []),
    ];
  else if (action.type === "PRIYA")
    ids = [state.lastLine, "OPEN-TESS", ...(guides ? ["G-DEALS"] : [])];
  else if (action.type === "ROLLOUT") ids = guides ? guide.lines : [];
  else if (action.type === "LOCK") ids = content.conversations.board.lines;
  else ids = [state.lastLine];
  return {
    title: guide.title,
    ids: [...new Set(ids)].slice(0, 3),
    task: guide.task,
    finish: guide.finish,
    reply: state.scene === "cold",
  };
}
