export function buildIdentityHeader(): string[] {
  return [
    `commit/build: ${__BUILD_ID__ || __GIT_COMMIT__ || "unknown"}`,
    `build_at_paris: ${__BUILD_AT_PARIS__ || "unknown"}`,
    `build_at_utc: ${__BUILD_AT_UTC__ || "unknown"}`,
  ];
}

type DiagnosticEvent = {
  at: string;
  area: string;
  stage: string;
  status: string;
  detail?: string;
};

const recentDiagnosticEvents: DiagnosticEvent[] = [];
const DIAGNOSTIC_EVENT_LIMIT = 30;

function redactDiagnosticValue(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[redacted-email]");
}

export function recordDiagnosticEvent(event: Omit<DiagnosticEvent, "at">): void {
  recentDiagnosticEvents.push({
    ...event,
    at: new Date().toISOString(),
    detail: event.detail ? redactDiagnosticValue(event.detail) : undefined,
  });
  if (recentDiagnosticEvents.length > DIAGNOSTIC_EVENT_LIMIT) {
    recentDiagnosticEvents.splice(0, recentDiagnosticEvents.length - DIAGNOSTIC_EVENT_LIMIT);
  }
}

export function buildDiagnosticsReport(context: Record<string, string> = {}): string {
  const lines = [
    ...buildIdentityHeader(),
    "SocialGlowz diagnostics",
    `app: ${__DISPLAY_NAME__}`,
    `version: ${__VERSION__}`,
    `git_commit: ${__GIT_COMMIT__ || "unknown"}`,
    `build_id: ${__BUILD_ID__ || "unknown"}`,
    `user_agent: ${navigator.userAgent}`,
    `platform: ${navigator.platform || "unknown"}`,
    `online: ${navigator.onLine ? "yes" : "no"}`,
    `viewport: ${window.innerWidth}x${window.innerHeight}`,
    `tauri: ${"__TAURI_INTERNALS__" in window ? "yes" : "no"}`,
    `locale: ${navigator.language || "unknown"}`,
    `theme: ${localStorage.getItem("sfz_theme_mode") || "unknown"}`,
  ];

  for (const key of Object.keys(context)) {
    const value = context[key]
    lines.push(`${key}: ${redactDiagnosticValue(value)}`);
  }

  lines.push("recent_events:");
  if (recentDiagnosticEvents.length === 0) {
    lines.push("- none");
  } else {
    for (const event of recentDiagnosticEvents) {
      lines.push(
        `- ${event.at} ${event.area}/${event.stage} ${event.status}${event.detail ? ` | ${event.detail}` : ""}`,
      );
    }
  }

  return lines.join("\n");
}
