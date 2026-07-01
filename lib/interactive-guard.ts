// Pure decision logic for the interactive-command guide.
//
// Functional core: no I/O. The plugin passes the command and the alternatives
// table; this returns a decision. Tested under `node --test`.
//
// Closes the two coverage gaps the original plugin documented as "~90%":
//   1. env-var prefixes:  `FOO=bar python`   -> previously slipped through
//   2. pipelines/chains:  `echo x | python`  -> previously only saw `echo`
// by classifying every segment of a pipeline/chain, each with its env prefix
// stripped. This is a heuristic *guide*, not a sandbox: the real defence
// against a hung process is a command timeout, which the model controls.

export type Decision = { block: false } | { block: true; binary: string; hint: string }

/** Strip leading `NAME=value` env assignments from a single segment's tokens. */
function stripEnvPrefix(tokens: string[]): string[] {
  let i = 0
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++
  return tokens.slice(i)
}

/** Split a command line into pipeline/chain segments on | || && ; */
function segments(command: string): string[] {
  return command
    .split(/\|\||&&|[|;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function classifyInteractive(
  command: string,
  alternatives: Record<string, string>,
  safeFlags: ReadonlySet<string>,
): Decision {
  for (const seg of segments(command)) {
    const parts = stripEnvPrefix(seg.split(/\s+/).filter(Boolean))
    const binary = parts[0]
    if (!binary || !alternatives[binary]) continue

    if (parts.length > 1) {
      const hasSafeFlag = parts.some((p) => safeFlags.has(p))
      const hasFileArg = parts.some((p) => /\.\w{1,5}$/.test(p))
      if (hasSafeFlag || hasFileArg) continue
    }

    return { block: true, binary, hint: alternatives[binary] }
  }
  return { block: false }
}
