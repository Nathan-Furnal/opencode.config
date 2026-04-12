import type { Plugin } from "@opencode-ai/plugin"
import { existsSync } from "fs"
import { join } from "path"

// Session memory: deterministically writes a summary of recent
// git activity to .opencode/memory/session-summary.md on idle.
//
// Replaces the advisory AGENTS.md instruction with guaranteed execution.
// The AGENTS.md tells the agent to read this file at session start.
//
// Skips writes when nothing changed since the last write.
//
// Disable by deleting this file. No other plugin depends on it,
// though the compaction-preserver reads the file this produces.

export const SessionMemory: Plugin = async ({ $, worktree, client }) => {
  const memoryDir = join(worktree, ".opencode", "memory")
  await $`mkdir -p ${memoryDir}`.quiet().nothrow()

  let lastHash = ""

  return {
    // FIX: session.idle is a generic event, not a direct hook key.
    // Direct keys are only: tool.execute.before, tool.execute.after,
    // shell.env, experimental.session.compacting, and a few others.
    // All session.* events must be routed through the `event` handler.
    event: async ({ event }) => {
      if (event.type !== "session.idle") return

      try {
        const branch = (await $`git branch --show-current`.quiet().nothrow())
          .stdout.toString().trim()
        const log = (await $`git log --oneline -5 2>/dev/null`.quiet().nothrow())
          .stdout.toString().trim()
        const status = (await $`git status --short 2>/dev/null`.quiet().nothrow())
          .stdout.toString().trim()

        const hash = `${branch}|${log}|${status}`
        if (hash === lastHash) return
        lastHash = hash

        const diff = (await $`git diff --stat HEAD~3 2>/dev/null`.quiet().nothrow())
          .stdout.toString().trim()

        const date = new Date().toISOString().split("T")[0]
        const parts = [
          `# Session Summary`,
          `_Auto-generated on ${date}. Read at session start per AGENTS.md._`,
          ``,
          `**Branch**: ${branch || "(detached)"}`,
        ]

        if (log)    parts.push(``, `## Recent commits`, `\`\`\``, log, `\`\`\``)
        if (diff)   parts.push(``, `## Changed files (last 3 commits)`, `\`\`\``, diff, `\`\`\``)
        if (status) parts.push(``, `## Uncommitted changes`, `\`\`\``, status, `\`\`\``)

        for (const f of ["PLAN.md", "spec.md", "TODO.md"]) {
          if (existsSync(join(worktree, f))) {
            parts.push(``, `**Active**: ${f}`)
          }
        }

        await Bun.write(join(memoryDir, "session-summary.md"), parts.join("\n") + "\n")
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await client.app.log({
          body: {
            service: "session-memory",
            level: "error",
            message: `Failed to write session summary: ${msg}`,
          },
        })
      }
    },
  }
}
