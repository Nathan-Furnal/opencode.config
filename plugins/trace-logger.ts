import type { Plugin } from "@opencode-ai/plugin"
import { appendFileSync, mkdirSync } from "fs"
import { join } from "path"

// Trace logger: appends a record for every tool call to
// .opencode/memory/trace.jsonl for diagnostics and harness tuning.
//
// Usage:
//   grep '"tool":"bash"' .opencode/memory/trace.jsonl | tail -20
//   wc -l .opencode/memory/trace.jsonl
//   Clear when large:  > .opencode/memory/trace.jsonl
//
// Uses appendFileSync for O(1) writes. Never reads the file.
//
// NOTE on exit codes: the `tool.execute.after` hook types (@opencode-ai/plugin
// 1.14.48) expose `output.metadata` as `any` and do NOT document an exitCode
// field for the bash tool. Earlier versions of this plugin recorded
// `output.metadata.exitCode` and offered a `grep exitCode:1` workflow — that was
// an unverified assumption and produced `undefined` in practice. We now record
// only fields the type surface guarantees. `title` is the tool's own summary
// line (for bash, its description) and is a reliable, typed signal to grep on.
// If a future opencode version documents a structured exit field, add it here
// behind a real check — do not guess.
//
// The reliable failure-feedback loop lives elsewhere by design: LSP surfaces
// diagnostics in real time, and the git pre-commit/pre-push hooks surface
// structured failures to the agent when it tries to commit/push. This logger is
// for human/offline diagnostics, not for steering the agent mid-run.
//
// Disable by deleting this file. No other plugin depends on it.

export const TraceLogger: Plugin = async ({ worktree }) => {
  const memoryDir = join(worktree, ".opencode", "memory")
  const tracePath = join(memoryDir, "trace.jsonl")

  return {
    "tool.execute.after": async (input, output) => {
      try {
        mkdirSync(memoryDir, { recursive: true })
        const entry = JSON.stringify({
          ts: new Date().toISOString(),
          tool: input.tool,
          file: (input.args?.filePath ?? input.args?.file) as string | undefined,
          command: input.tool === "bash" ? (input.args?.command as string | undefined) : undefined,
          title: output.title, // typed summary; for bash this is the description
        })
        appendFileSync(tracePath, entry + "\n")
      } catch {
        // Best-effort. Must never interrupt the agent's work.
      }
    },
  }
}
