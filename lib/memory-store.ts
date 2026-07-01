// Pure logic for agent-authored memory (retain / recall / forget).
//
// Anthropic's "structured note-taking" and oh-my-pi's retain/recall: let the
// agent write durable facts mid-run and pull them back later, so knowledge
// survives compaction and new sessions without bloating every prompt. This
// complements session-memory (which is deterministic git activity) with
// intentional, agent-written notes.
//
// Functional core: parsing, filtering, rendering, removal are pure and tested.
// The plugin (imperative shell) owns the JSONL file I/O.

export type NoteRecord = { ts: string; note: string; tags: string[] }

/** Build a note record. Separated so the plugin never constructs ad hoc shapes. */
export function formatNote(note: string, tags: string[] | undefined, now: Date): NoteRecord {
  return {
    ts: now.toISOString(),
    note: note.trim(),
    tags: (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
  }
}

/** Parse a notes.jsonl body into records, skipping malformed lines. */
export function parseNotes(jsonl: string): NoteRecord[] {
  const out: NoteRecord[] = []
  for (const line of jsonl.split("\n")) {
    const t = line.trim()
    if (!t) continue
    try {
      const r = JSON.parse(t)
      if (typeof r?.note === "string" && typeof r?.ts === "string") {
        out.push({ ts: r.ts, note: r.note, tags: Array.isArray(r.tags) ? r.tags : [] })
      }
    } catch {
      // skip malformed line — never let one bad row break recall
    }
  }
  return out
}

/**
 * Return the most relevant notes for a query, newest first.
 * A query is matched case-insensitively against the note text and tags; an
 * empty query returns the most recent notes. Recency is the tie-breaker.
 */
export function filterNotes(
  notes: readonly NoteRecord[],
  query: string | undefined,
  limit = 10,
): NoteRecord[] {
  const q = (query ?? "").trim().toLowerCase()
  const terms = q ? q.split(/\s+/) : []
  const matched = notes.filter((n) => {
    if (terms.length === 0) return true
    const hay = (n.note + " " + n.tags.join(" ")).toLowerCase()
    return terms.every((term) => hay.includes(term))
  })
  matched.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0)) // newest first
  return matched.slice(0, Math.max(1, limit))
}

/** Human/LLM-readable rendering of notes for the recall tool result. */
export function renderNotes(notes: readonly NoteRecord[]): string {
  if (notes.length === 0) return "No matching notes."
  return notes
    .map((n) => {
      const date = n.ts.slice(0, 10)
      const tags = n.tags.length ? ` [${n.tags.join(", ")}]` : ""
      return `- (${date})${tags} ${n.note}`
    })
    .join("\n")
}

/** Remove notes whose text or tags contain `contains` (case-insensitive). */
export function removeMatching(
  notes: readonly NoteRecord[],
  contains: string,
): { kept: NoteRecord[]; removed: number } {
  const needle = contains.trim().toLowerCase()
  if (!needle) return { kept: [...notes], removed: 0 }
  const kept = notes.filter(
    (n) => !(n.note + " " + n.tags.join(" ")).toLowerCase().includes(needle),
  )
  return { kept, removed: notes.length - kept.length }
}
