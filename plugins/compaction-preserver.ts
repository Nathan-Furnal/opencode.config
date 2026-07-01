import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

// Compaction preserver: injects critical project files into the
// compaction prompt so they survive when OpenCode trims context.
//
// Without this, compaction can erase which task you're on,
// what the spec requires, and what happened earlier.
//
// Each file is capped at 2000 chars to avoid bloating the prompt.
//
// Disable by deleting this file. No other plugin depends on it.

const CRITICAL_FILES = [
  "PLAN.md",
  "spec.md",
  "TODO.md",
  ".opencode/memory/session-summary.md",
]

const MAX_CHARS = 2000

export const CompactionPreserver: Plugin = async ({ worktree }) => {
  return {
    "experimental.session.compacting": async (_input, output) => {
      const sections: string[] = []

      for (const file of CRITICAL_FILES) {
        const path = join(worktree, file)
        if (!existsSync(path)) continue

        try {
          const content = readFileSync(path, "utf8")
          if (!content.trim()) continue

          const trimmed = content.length > MAX_CHARS
            ? content.slice(0, MAX_CHARS) + "\n\n[...truncated at 2000 chars]"
            : content

          sections.push(`### ${file}\n${trimmed}`)
        } catch {
          // File exists but unreadable — skip without breaking compaction
        }
      }

      if (sections.length > 0) {
        output.context.push(
          "## Preserved context (injected by compaction-preserver plugin)\n\n" +
          "These files define the current task and spec. They were active before compaction.\n\n" +
          sections.join("\n\n---\n\n")
        )
      }
    },
  }
}
