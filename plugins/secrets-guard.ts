import type { Plugin } from "@opencode-ai/plugin"
import { classifyFileAccess, classifyBashAccess } from "../lib/secrets-guard.ts"

// Secrets guard: blocks pulling secret files (.env, private keys, credentials)
// into context via the read/edit/write tools or via bash content readers
// (cat/grep/head/…). Example/template env files stay readable.
//
// This enforces the "never trust/commit secrets" rule the python-practices skill
// only states. Once a secret is in context it can leak into logs, commits, or
// the provider — so this is a guard, not a guide.
//
// Decision logic lives in lib/secrets-guard.ts and is unit-tested. This is
// conservative by design (see the allow-list for example/template files); widen
// SECRET_FILE there if your repo uses other secret shapes.
//
// Disable by deleting this file. No other plugin depends on it.

export const SecretsGuard: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        const command: string = output.args?.command ?? ""
        const d = classifyBashAccess(command)
        if (d.block) throw new Error(`BLOCKED: ${d.reason}`)
        return
      }
      const filePath: string | undefined = output.args?.filePath ?? output.args?.file
      const d = classifyFileAccess(input.tool, filePath)
      if (d.block) throw new Error(`BLOCKED: ${d.reason}`)
    },
  }
}
