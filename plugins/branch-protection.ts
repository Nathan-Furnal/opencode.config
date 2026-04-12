import type { Plugin } from "@opencode-ai/plugin"

// Branch protection: blocks git commit and git push on protected
// branches. Forces work on feature branches with PRs.
//
// Also catches explicit target: `git push origin main`.
// Does not block --amend (fixup commits on feature branches).
//
// Disable by deleting this file. No other plugin depends on it.

const PROTECTED = new Set(["main", "master", "production", "release"])

export const BranchProtection: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const command: string = output.args.command ?? ""

      // FIX: use .test() instead of .match() — intent is boolean, not capture.
      const isCommit = /\bgit\s+commit\b/.test(command) && !command.includes("--amend")
      const isPush = /\bgit\s+push\b/.test(command)

      if (!isCommit && !isPush) return

      const branch = (await $`git branch --show-current`.quiet().nothrow())
        .stdout.toString().trim()

      if (isCommit && PROTECTED.has(branch)) {
        throw new Error(
          `BLOCKED: committing directly on \`${branch}\` is not allowed.\n` +
          `Switch to a feature branch first: git checkout -b feature/<name>`
        )
      }

      if (isPush) {
        if (PROTECTED.has(branch)) {
          throw new Error(
            `BLOCKED: pushing directly to \`${branch}\` is not allowed.\n` +
            `Create a feature branch and open a PR instead.`
          )
        }

        // Catch explicit remote target: `git push origin main`
        for (const name of PROTECTED) {
          if (new RegExp(`\\bgit\\s+push\\s+\\S+\\s+${name}\\b`).test(command)) {
            throw new Error(
              `BLOCKED: pushing to \`${name}\` is not allowed.\n` +
              `Push your feature branch and open a PR instead.`
            )
          }
        }
      }
    },
  }
}
