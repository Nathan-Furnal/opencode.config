import type { Plugin } from "@opencode-ai/plugin"
import { classifyInteractive } from "../lib/interactive-guard.ts"

// Interactive command guard GUIDE: blocks commands that would hang in OpenCode's
// non-TTY shell and tells the agent the non-interactive alternative.
//
// Decision logic lives in lib/interactive-guard.ts and is unit-tested. The two
// holes the previous version documented as "~90%" are now closed and have
// regression tests: env-var prefixes (`FOO=bar python`) and pipelines/chains
// (`echo x | python`) are both classified per-segment.
//
// This remains a heuristic guide, not a sandbox. The robust defence against a
// genuinely hung process is a command timeout (which the model sets on the bash
// tool); this plugin just turns the common footguns into actionable feedback.
//
// Disable by deleting this file. No other plugin depends on it.

const ALTERNATIVES: Record<string, string> = {
  python:  "Use `python -c '...'` or `python script.py`",
  python3: "Use `python3 -c '...'` or `python3 script.py`",
  ipython: "Use `python -c '...'` instead",
  node:    "Use `node -e '...'` or `node script.js`",
  irb:     "Use `ruby -e '...'` or `ruby script.rb`",
  ghci:    "Use `runghc script.hs` instead",
  ssh:     "Use `ssh -o BatchMode=yes host command` for non-interactive access",
  less:    "Use `cat` or `head -n 100`",
  more:    "Use `cat` or `head -n 100`",
  vim:     "Use the edit or write tool instead",
  vi:      "Use the edit or write tool instead",
  nano:    "Use the edit or write tool instead",
  emacs:   "Use the edit or write tool instead",
  top:     "Use `ps aux --sort=-%mem | head -20` instead",
  htop:    "Use `ps aux --sort=-%mem | head -20` instead",
  mysql:   "Use `mysql -e 'SQL'` for non-interactive queries",
  psql:    "Use `psql -c 'SQL'` for non-interactive queries",
  sqlite3: "Use `sqlite3 db.sqlite 'SQL'` for non-interactive queries",
  redis:   "Use `redis-cli COMMAND` for non-interactive access",
}

const SAFE_FLAGS = new Set(["-c", "-e", "-m", "--version", "--help", "--batch", "--no-pager"])

export const InteractiveGuard: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      const command: string = output.args?.command ?? ""

      const decision = classifyInteractive(command, ALTERNATIVES, SAFE_FLAGS)
      if (!decision.block) return

      throw new Error(
        `BLOCKED: \`${decision.binary}\` would start an interactive session that will hang.\n` +
        `OpenCode's shell has no TTY.\n` +
        `${decision.hint}.`,
      )
    },
  }
}
