import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"
import {
  formatNote,
  parseNotes,
  filterNotes,
  renderNotes,
  removeMatching,
} from "../lib/memory-store.ts"

// Agent-authored memory: retain / recall / forget durable notes, project-scoped
// to .opencode/memory/notes.jsonl. Complements the deterministic session-memory
// plugin (git activity) with facts the agent chooses to keep — decisions,
// gotchas, invariants — so they survive compaction and new sessions.
//
// Notes are plain JSONL; inspect or edit them by hand. Decision logic lives in
// lib/memory-store.ts and is unit-tested; this file is just fs + tool wiring.
//
// Disable by deleting this file. No other plugin depends on it.

function notesPath(worktree: string): string {
  return join(worktree, ".opencode", "memory", "notes.jsonl")
}

function readAll(worktree: string) {
  const p = notesPath(worktree)
  if (!existsSync(p)) return []
  return parseNotes(readFileSync(p, "utf8"))
}

export const Memory: Plugin = async () => {
  return {
    tool: {
      memory_retain: tool({
        description:
          "Save a durable note about this project (a decision, gotcha, invariant, " +
          "or where something lives) so it survives compaction and future sessions. " +
          "Use for facts worth remembering, not transient state.",
        args: {
          note: tool.schema.string().min(1).describe("The fact to remember, one sentence."),
          tags: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe("Optional tags for later recall, e.g. ['auth', 'db']."),
        },
        async execute(args, ctx) {
          const record = formatNote(args.note, args.tags, new Date())
          const dir = join(ctx.worktree, ".opencode", "memory")
          mkdirSync(dir, { recursive: true })
          appendFileSync(notesPath(ctx.worktree), JSON.stringify(record) + "\n")
          return `Remembered: ${record.note}`
        },
      }),

      memory_recall: tool({
        description:
          "Retrieve previously saved project notes. Optionally filter by a query " +
          "(matched against note text and tags). Call this at the start of work on " +
          "an area to reload what you learned before.",
        args: {
          query: tool.schema
            .string()
            .optional()
            .describe("Words to match against notes and tags; omit for most recent."),
          limit: tool.schema.number().int().min(1).max(50).optional()
            .describe("Max notes to return (default 10)."),
        },
        async execute(args, ctx) {
          const notes = filterNotes(readAll(ctx.worktree), args.query, args.limit ?? 10)
          return renderNotes(notes)
        },
      }),

      memory_forget: tool({
        description:
          "Delete saved notes whose text or tags contain the given phrase. Use to " +
          "prune stale or superseded facts.",
        args: {
          contains: tool.schema.string().min(1)
            .describe("Notes containing this phrase (in text or tags) are removed."),
        },
        async execute(args, ctx) {
          const { kept, removed } = removeMatching(readAll(ctx.worktree), args.contains)
          if (removed > 0) {
            const body = kept.map((n) => JSON.stringify(n)).join("\n")
            writeFileSync(notesPath(ctx.worktree), body ? body + "\n" : "")
          }
          return `Forgot ${removed} note(s) matching "${args.contains}".`
        },
      }),
    },
  }
}
