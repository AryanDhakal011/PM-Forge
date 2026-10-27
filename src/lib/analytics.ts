type EventPayload = Record<string, string | number | boolean | undefined>;

export type AnalyticsEvent =
  | "page_view"
  | "hero_enter_click"
  | "signal_test_started"
  | "signal_selected"
  | "signal_justified"
  | "signal_isolate"
  | "signal_skipped"
  | "lesson_open"
  | "interview_started"
  | "mic_permission"
  | "interview_submitted"
  | "interview_reset"
  | "project_scenario"
  | "project_phase"
  | "project_decision"
  | "project_reset"
  | "sprint_check"
  | "decision_record_copy"
  | "pressure_pivot"
  | "pressure_stay"
  | "interview_timeout"
  | "interview_mute"
  | "interview_validation_failed"
  | "interview_retry"
  | "interview_feedback_copy"
  | "career_linkedin"
  | "career_role"
  | "haptics_toggle"
  | "profile_copy"
  | "blueprint_open"
  | "blueprint_created"
  | "blueprint_validation_failed"
  | "blueprint_copy"
  | "blueprint_download"
  | "blueprint_cleared"
  | "start_learning"
  | "reduced_motion_toggle"
  | "search_open"
  | "signup_submitted"
  | "login_submitted"
  | "logout"
  | "lesson_complete";

/**
 * Vendor-neutral dispatcher. In development events are visible in the console.
 * A real deployment can forward the CustomEvent to any analytics sink without
 * touching the components that emit the events.
 */
export function track(event: AnalyticsEvent, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;

  const record = {
    event,
    ...payload,
    path: window.location.pathname,
    at: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent("pmforge:analytics", { detail: record }),
  );

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, payload);
  }
}
