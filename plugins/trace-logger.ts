import type { Plugin } from "@opencode-ai/plugin"
import { appendFileSync } from "fs"
import { join } from "path"

// Trace logger: appends a record for every tool call to
// .opencode/memory/trace.jsonl for diagnostics and harness tuning.
//
// Usage:
//   grep '"tool":"bash"' .opencode/memory/trace.jsonl | tail -20
//   grep '"exitCode":1' .opencode/memory/trace.jsonl
//   wc -l .opencode/memory/trace.jsonl
//
// Clear when large:  > .opencode/memory/trace.jsonl
//
// Uses appendFileSync for O(1) writes. Never reads the file.
//
// Disable by deleting this file. No other plugin depends on it.

export const TraceLogger: Plugin = async ({ $, worktree }) => {
  const tracePath = join(worktree, ".opencode", "memory", "trace.jsonl")
  await $`mkdir -p ${join(worktree, ".opencode", "memory")}`.quiet().nothrow()

  return {
    // FIX: tool.execute.after signature is:
    //   (input: { tool, sessionID, callID, args }, output: { title, output, metadata })
    //
    // The original code used `input.metadata?.args` which is wrong on two counts:
    //   1. `args` lives directly on `input`, not under `input.metadata`
    //   2. `metadata` (including exitCode) lives on `output`, not `input`
    "tool.execute.after": async (input, output) => {
      try {
        const entry = JSON.stringify({
          ts: new Date().toISOString(),
          tool: input.tool,
          file: (input.args?.filePath ?? input.args?.file) as string | undefined,
          command: input.tool === "bash" ? (input.args?.command as string | undefined) : undefined,
          // exitCode is carried in output.metadata by the runtime; guard with ?. as
          // the field is not guaranteed for every tool (e.g. read, write have none).
          exitCode: (output.metadata as Record<string, unknown> | undefined)?.exitCode,
        })
        appendFileSync(tracePath, entry + "\n")
      } catch {
        // Best-effort. Must never interrupt the agent's work.
      }
    },
  }
}
