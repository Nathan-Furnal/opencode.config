import type { Plugin } from "@opencode-ai/plugin"
import { classifyGitWrite } from "../lib/git-guard.ts"

// Branch protection GUIDE: gives the agent immediate feedback before a commit or
// push on a protected branch runs, so it doesn't waste a round trip discovering
// the failure. Feature-branch + PR workflow.
//
// This is deliberately NOT the enforcement boundary. Command-string analysis can
// always be evaded (`git$IFS commit`, subshells, aliases), so the structural
// backstop is a real git pre-commit/pre-push hook installed via `npm run setup`
// (see githooks/). Defence in depth: fast guide here, un-evadable hook there.
//
// The decision logic lives in lib/git-guard.ts and is unit-tested
// (tests/git-guard.test.ts) — including env-prefixes, `-C`, refspecs, and the
// commit-tree false-positive the previous substring regex had.
//
// Disable by deleting this file. No other plugin depends on it.

export const BranchProtection: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const command: string = output.args?.command ?? ""
      if (!/\bgit\b/.test(command)) return // cheap pre-filter

      const branch = (await $`git branch --show-current`.quiet().nothrow())
        .stdout.toString().trim()

      const decision = classifyGitWrite(command, branch)
      if (decision.block) throw new Error(`BLOCKED: ${decision.reason}`)
    },
  }
}
