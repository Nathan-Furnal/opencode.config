// Pure decision logic for the branch-protection guide.
//
// This is the functional core: no I/O, no Bun, no opencode types. The plugin
// (imperative shell) supplies the current branch and acts on the decision.
// Keeping it pure is what makes it testable under `node --test` and is the same
// functional-core/imperative-shell split this repo tells Python code to follow.
//
// IMPORTANT: this classifier is a fast pre-flight *guide* (Fowler), not the
// enforcement boundary. A committed git pre-commit/pre-push hook (githooks/) is
// the structural backstop that cannot be evaded by rephrasing the command
// (`git$IFS commit`, subshells, aliases). Do not treat this string analysis as
// a security control — treat it as immediate feedback that saves a round trip.

export type Decision = { block: false } | { block: true; reason: string }

const DEFAULT_PROTECTED = ["main", "master", "production", "release"]

/** Split a command line into whitespace tokens, ignoring empties. */
function tokenize(command: string): string[] {
  return command.trim().split(/\s+/).filter(Boolean)
}

/** Drop leading `NAME=value` environment assignments (e.g. `FOO=bar git ...`). */
function stripEnvPrefix(tokens: string[]): string[] {
  let i = 0
  while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++
  return tokens.slice(i)
}

/**
 * Resolve `git [global-opts] <subcommand> [rest]` to its subcommand, skipping
 * global options and their arguments. Returns null if the command is not git.
 * This is token-based on purpose: substring regexes false-match plumbing like
 * `git commit-tree` and miss `-C <dir>` global options.
 */
function gitSubcommand(tokens: string[]): { sub: string; rest: string[] } | null {
  if (tokens[0] !== "git") return null
  let i = 1
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === "-C" || t === "-c") {
      i += 2 // option takes an argument
      continue
    }
    if (t.startsWith("-")) {
      i += 1 // flag like --no-pager, --git-dir=...
      continue
    }
    break
  }
  if (i >= tokens.length) return null
  return { sub: tokens[i], rest: tokens.slice(i + 1) }
}

/** The branch a refspec (`src:dst` or `branch`) would update on the remote. */
function refspecTarget(ref: string): string {
  const idx = ref.indexOf(":")
  const dst = idx >= 0 ? ref.slice(idx + 1) : ref
  return dst.replace(/^refs\/heads\//, "")
}

/**
 * Decide whether a git write should be blocked on the current branch.
 *
 * @param command       the raw bash command
 * @param currentBranch result of `git branch --show-current` ("" if detached)
 * @param protectedList branch names to protect
 */
export function classifyGitWrite(
  command: string,
  currentBranch: string,
  protectedList: readonly string[] = DEFAULT_PROTECTED,
): Decision {
  const protectedSet = new Set(protectedList)
  const tokens = stripEnvPrefix(tokenize(command))
  const git = gitSubcommand(tokens)
  if (!git) return { block: false }

  const branch = currentBranch.trim()

  if (git.sub === "commit") {
    if (git.rest.includes("--amend")) return { block: false } // fixups on feature branches
    if (protectedSet.has(branch)) {
      return {
        block: true,
        reason:
          `committing directly on \`${branch}\` is not allowed.\n` +
          `Switch to a feature branch first: git checkout -b feature/<name>`,
      }
    }
    return { block: false }
  }

  if (git.sub === "push") {
    if (protectedSet.has(branch)) {
      return {
        block: true,
        reason:
          `pushing while on \`${branch}\` is not allowed.\n` +
          `Create a feature branch and open a PR instead.`,
      }
    }
    // Explicit target: `git push <remote> <refspec...>` — inspect the refspecs,
    // skipping flags. `git push origin main` and `git push origin HEAD:main`
    // both resolve to `main`.
    const positional = git.rest.filter((t) => !t.startsWith("-"))
    for (const ref of positional.slice(1)) {
      if (protectedSet.has(refspecTarget(ref))) {
        return {
          block: true,
          reason:
            `pushing to \`${refspecTarget(ref)}\` is not allowed.\n` +
            `Push your feature branch and open a PR instead.`,
        }
      }
    }
    return { block: false }
  }

  return { block: false }
}
