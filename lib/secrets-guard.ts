// Pure decision logic for the secrets guard.
//
// Turns an always-on rule ("never read/commit secrets", stated in the
// python skill) into a mechanical GUARD (Fowler): the agent cannot
// slurp a .env or private key into context, whether via the read/edit tools or
// via bash (`cat .env`, `grep KEY .env`). This matters most for a fintech
// codebase and is the one place a guide alone is not enough — once a secret is
// in context it can leak into logs, commits, or the model provider.
//
// Deliberately conservative to avoid false positives: example/template env
// files are allowed (they hold no secrets), and only well-known secret shapes
// are blocked. Functional core, unit-tested; the plugin is the imperative shell.

export type Decision = { block: false } | { block: true; path: string; reason: string }

// Files that look like secrets. Example/template variants are excluded below.
const SECRET_FILE = /(^|\/)(\.env(\.[^/]*)?|\.envrc|id_[a-z0-9]+|.*\.pem|.*\.key|.*\.p12|.*\.pfx|credentials|\.netrc|\.pgpass|secrets\.[a-z]+)$/i
// Never blocked: these are safe to read and are how the agent learns the shape.
const ALLOWED = /(^|\/)\.env\.(example|sample|template|dist|test)$/i
// Bash readers that would dump file contents into context.
const READERS = new Set([
  "cat", "less", "more", "head", "tail", "bat", "grep", "rg", "egrep", "fgrep",
  "awk", "sed", "xxd", "od", "strings", "nl", "tac", "cut",
])

function isSecretPath(p: string): boolean {
  const path = p.replace(/^['"]|['"]$/g, "")
  if (ALLOWED.test(path)) return false
  return SECRET_FILE.test(path)
}

/** Decide for the read/edit/write tools, given the file path argument. */
export function classifyFileAccess(tool: string, filePath: string | undefined): Decision {
  if (!filePath) return { block: false }
  if (!["read", "edit", "write", "apply_patch"].includes(tool)) return { block: false }
  if (isSecretPath(filePath)) {
    return {
      block: true,
      path: filePath,
      reason:
        `reading or writing \`${filePath}\` would pull secrets into context.\n` +
        `Refer to the key names (e.g. from .env.example) without their values, ` +
        `or read the variable at runtime instead of loading the file.`,
    }
  }
  return { block: false }
}

/** Decide for a bash command that may read a secret file. */
export function classifyBashAccess(command: string): Decision {
  const tokens = command.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { block: false }
  // Only inspect commands whose leading binary is a content reader.
  let i = 0
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++
  const binary = tokens[i]
  if (!binary || !READERS.has(binary.replace(/^.*\//, ""))) return { block: false }
  for (const t of tokens.slice(i + 1)) {
    if (t.startsWith("-")) continue
    if (isSecretPath(t)) {
      return {
        block: true,
        path: t,
        reason:
          `\`${binary}\` on \`${t}\` would dump secrets into context.\n` +
          `Reference the key names without values, or read them at runtime.`,
      }
    }
  }
  return { block: false }
}
