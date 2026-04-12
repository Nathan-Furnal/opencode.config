import type { Plugin } from "@opencode-ai/plugin"

// Interactive command guard: blocks commands that would hang in
// OpenCode's non-TTY shell environment, and tells the agent what
// to use instead.
//
// Known limitation: commands prefixed with env vars (FOO=bar python)
// or wrapped in pipes (echo | python) slip through because the
// heuristic only checks the first token. ~90% coverage.
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
      const command: string = output.args.command ?? ""
      const parts = command.trim().split(/\s+/)
      const binary = parts[0]

      if (!binary || !ALTERNATIVES[binary]) return

      if (parts.length > 1) {
        const hasSafeFlag = parts.some(p => SAFE_FLAGS.has(p))
        const hasFileArg = parts.some(p => /\.\w{1,5}$/.test(p))
        if (hasSafeFlag || hasFileArg) return
      }

      throw new Error(
        `BLOCKED: \`${binary}\` would start an interactive session that will hang.\n` +
        `OpenCode's shell has no TTY.\n` +
        `${ALTERNATIVES[binary]}.`
      )
    },
  }
}
