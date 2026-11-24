import { slugify } from "./text";

/**
 * Server-only client for the second brain MCP (brain.eggisatria.my.id).
 * One stateless JSON-RPC POST per call. Every function is best effort: when
 * BRAIN_MCP_URL or BRAIN_MCP_TOKEN is missing, or the brain is down, reads
 * return empty and writes return null, so CV work never fails because of it.
 *
 * Application notes hold company, role, stage, dates, source, job link, CV
 * link and ATS score only: no job description text, recruiter contacts,
 * salary, phone numbers or personal names.
 */

const DEFAULT_FOLDER = "03-Areas/Career-Applications/";

export function brainConfigured() {
  return Boolean(process.env.BRAIN_MCP_URL && process.env.BRAIN_MCP_TOKEN);
}

function applicationsFolder() {
  const f = process.env.BRAIN_APPLICATIONS_FOLDER || DEFAULT_FOLDER;
  return f.endsWith("/") ? f : `${f}/`;
}

async function callTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const url = process.env.BRAIN_MCP_URL;
  const token = process.env.BRAIN_MCP_TOKEN;
  if (!url || !token) return { ok: false, error: "Brain is not configured." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { ok: false, error: `Brain HTTP ${res.status}` };
    const raw = await res.text();
    // The server may answer as JSON or as one SSE event.
    const json = raw.trimStart().startsWith("{")
      ? JSON.parse(raw)
      : JSON.parse(
          raw
            .split("\n")
            .find((l) => l.startsWith("data:"))
            ?.slice(5) ?? "{}",
        );
    if (json.error)
      return { ok: false, error: json.error.message ?? "Brain error" };
    const result = json.result;
    const text: string =
      result?.content?.find((c: { type: string }) => c.type === "text")?.text ??
      "";
    if (result?.isError)
      return { ok: false, error: text || "Brain tool error" };
    try {
      return { ok: true, data: JSON.parse(text) as T };
    } catch {
      return { ok: true, data: text as T };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export interface BrainHit {
  path: string;
  title: string;
  snippet?: string;
  score?: number;
}

export async function brainSearch(
  query: string,
  opts: { folder?: string; limit?: number } = {},
): Promise<BrainHit[]> {
  const r = await callTool<BrainHit[]>("kb_search", {
    query: query.slice(0, 300),
    limit: opts.limit ?? 8,
    ...(opts.folder ? { folder: opts.folder } : {}),
  });
  return r.ok && Array.isArray(r.data) ? r.data : [];
}

/** Note text (outline plus summary for long notes, as kb_read mode=auto returns it). */
export async function brainRead(
  path: string,
  mode: "auto" | "full" = "auto",
): Promise<string | null> {
  const r = await callTool<unknown>("kb_read", { path, mode });
  if (!r.ok) return null;
  if (typeof r.data === "string") return r.data;
  const d = r.data as { content?: string; text?: string };
  return d.content ?? d.text ?? JSON.stringify(d);
}

export interface ApplicationLog {
  company: string;
  role: string;
  cvSlug?: string | null;
  cvUrl?: string | null;
  atsScore?: number | null;
  /** Stage name in lower case, for example "applied" or "interview". */
  status: string;
  source?: string | null;
  jobUrl?: string | null;
  note?: string;
}

/** Create the application note, or add a log line when it already exists. Returns the note path. */
export async function logApplication(
  a: ApplicationLog,
  existingPath?: string | null,
): Promise<string | null> {
  const day = new Date().toISOString().slice(0, 10);
  const clean = (s: string) =>
    s
      .replace(/[\r\n|]+/g, " ")
      .trim()
      .slice(0, 160);
  const cv = a.cvSlug
    ? ` CV ${a.cvSlug}${a.atsScore != null ? `, ATS ${a.atsScore}` : ""}.`
    : "";
  const line = `- ${day}: ${a.status}.${cv}${a.note ? ` ${clean(a.note)}` : ""}`;
  const path =
    existingPath ||
    `${applicationsFolder()}${slugify(`${a.company} ${a.role}`).slice(0, 80) || "application"}.md`;

  if (!existingPath) {
    const content = [
      "---",
      "type: application",
      `company: "${clean(a.company)}"`,
      `role: "${clean(a.role)}"`,
      `status: ${a.status}`,
      ...(a.source ? [`source: "${clean(a.source)}"`] : []),
      ...(a.jobUrl ? [`job: ${clean(a.jobUrl)}`] : []),
      ...(a.cvUrl ? [`cv: ${a.cvUrl}`] : []),
      `created: ${day}`,
      "tags: [career, application]",
      "---",
      "",
      `# ${clean(a.company)}: ${clean(a.role)}`,
      "",
      ...(a.cvSlug && a.cvUrl
        ? [`CV version: [${a.cvSlug}](${a.cvUrl})`, ""]
        : []),
      "## Log",
      "",
      line,
      "",
    ].join("\n");
    const created = await callTool("kb_write", {
      path,
      content,
      reason: "CV studio: new application",
    });
    if (created.ok) return path;
  }
  // The note exists (or creation raced): append to its log instead.
  const appended = await callTool("kb_append", {
    path,
    heading: "Log",
    text: line,
    reason: `CV studio: ${a.status}`,
  });
  return appended.ok ? path : null;
}
