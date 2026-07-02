// Pure logic for the drift-sweep's memory lens.
//
// The memory plugin accumulates agent-written notes (decisions, gotchas,
// friction) in .opencode/memory/notes.jsonl. Over a repo's life those notes are
// evidence: topics that recur are candidates for a repo-specific skill, and
// notes that express friction point at annoyances worth removing. This module
// turns the raw notes into that summary. It is pure and tested; the plugin
// (imperative shell) and the /drift-sweep command own the I/O and the acting.

import type { NoteRecord } from "./memory-store.ts"

export type Topic = { tag: string; count: number }
export type Frustration = { note: string; ts: string; reason: string }
export type MemoryReview = {
  recurringTopics: Topic[]
  frustrations: Frustration[]
  skillSuggestions: string[]
}

// Tags an agent (or human) uses to mark friction explicitly.
const FRUSTRATION_TAGS = new Set([
  "frustration",
  "annoyance",
  "gotcha",
  "footgun",
  "papercut",
  "friction",
  "pain",
  "workaround",
])

// Phrasings that signal a recurring annoyance even when untagged. Each marker
// requires FAILURE context, not a bare recurrence word: "keeps tokens in
// memory" and "run it again" are ordinary prose; "keeps failing" and "broke
// again" are friction. Tested against both directions in
// tests/memory-analyze.test.ts — extend the tests when extending this list.
const FRUSTRATION_MARKERS: readonly RegExp[] = [
  /\b(?:broke|breaks|failed|fails|crashed|crashes|flaked|flakes|regressed|hangs?|hung) again\b/i,
  /\bagain(?::|,)? (?:the|this|that )?\w* ?(?:broke|failed|crashed|flaked|hung)\b/i,
  /\bkeeps? (?:failing|breaking|flaking|crashing|hanging|resetting|forgetting|reverting|timing out)\b/i,
  /\bstill (?:broken|failing|flaky|doesn'?t|won'?t|can'?t)\b/i,
  /every time\b.{0,40}\b(?:fails?|breaks?|crashes?|have to|need to)/i,
  /had to (?:manually|redo|re-run|rerun|work around)/i,
  /\bworkaround\b/i,
  /\bannoying\b/i,
  /\bwhy (?:does|is|won'?t|can'?t|do i (?:always|keep))/i,
]

function frustrationReason(n: NoteRecord): string | null {
  const tagged = n.tags.filter((t) => FRUSTRATION_TAGS.has(t))
  if (tagged.length) return `tagged ${tagged.join("/")}`
  if (FRUSTRATION_MARKERS.some((re) => re.test(n.note))) return "recurrence/annoyance phrasing"
  return null
}

/**
 * Summarize accumulated notes into recurring topics, friction points, and
 * concrete suggestions. `minTopicCount` is the threshold at which a repeated tag
 * becomes "recurring" (default 3). Deterministic: stable ordering, no clock.
 */
export function analyzeMemory(
  notes: readonly NoteRecord[],
  opts?: { minTopicCount?: number },
): MemoryReview {
  const minTopicCount = Math.max(2, opts?.minTopicCount ?? 3)

  const tagCounts = new Map<string, number>()
  for (const n of notes) {
    for (const t of n.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
  }
  const recurringTopics: Topic[] = [...tagCounts.entries()]
    .filter(([tag, c]) => c >= minTopicCount && !FRUSTRATION_TAGS.has(tag))
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))

  const frustrations: Frustration[] = notes
    .map((n) => {
      const reason = frustrationReason(n)
      return reason ? { note: n.note, ts: n.ts, reason } : null
    })
    .filter((x): x is Frustration => x !== null)
    .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0)) // newest first

  const skillSuggestions: string[] = []
  for (const { tag, count } of recurringTopics) {
    skillSuggestions.push(
      `${count} notes tagged "${tag}" — consider a repo-specific skill capturing that workflow.`,
    )
  }
  if (frustrations.length >= minTopicCount) {
    skillSuggestions.push(
      `${frustrations.length} friction notes — consider a guide or automation to remove the recurring annoyance.`,
    )
  }

  return { recurringTopics, frustrations, skillSuggestions }
}

/** Render a review for a tool result / the drift-sweep report. */
export function renderReview(r: MemoryReview): string {
  const section = (title: string, lines: string[], empty: string) =>
    `## ${title}\n` + (lines.length ? lines.join("\n") : empty)

  return [
    section(
      "Recurring topics",
      r.recurringTopics.map((t) => `- ${t.tag} (${t.count})`),
      "- none above threshold",
    ),
    section(
      "Friction / frustrations",
      r.frustrations.map((f) => `- (${f.ts.slice(0, 10)}) ${f.note} [${f.reason}]`),
      "- none detected",
    ),
    section("Skill suggestions", r.skillSuggestions.map((s) => `- ${s}`), "- none"),
  ].join("\n\n")
}
