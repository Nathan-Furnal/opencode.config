# Configuration

My opencode harness. Framed as **guides** (steer before acting) and **sensors**
(check after acting), after Böckeler/Fowler's harness engineering: you want both,
and the fast ones should be computational (linters, types, tests), not inferential.

## Agents

`AGENTS.md` holds the always-on rules, injected every turn. Keep it lean; it
points to the `design-principles` skill for structural decisions rather than
duplicating them.

Subagents in `agents/` enforce a second opinion from a different model: `planner`
(decomposition, write-only to plan files) and `adversary` (hostile review,
read-only). Different models for planning vs. review reduces correlated blind
spots.

## Guides (feed-forward)

- `AGENTS.md` — coding rules and workflow.
- `skills/` — software-design steering (`design-principles`, `spec-assertions`,
  `vsdd-review`), Python practice/tooling/maintenance/debugging, and the learning skills
  (`learning-goal`, `learning-opportunities`) after Dr. Cat Hicks's work.

## Sensors (feedback)

Deterministic quality gates, layered fast-to-slow:

- **Live:** LSP (`ruff`, `ty`) surfaces diagnostics as the agent types; the
  `ruff` formatter auto-fixes and formats each `.py` edit (`opencode.jsonc`), so
  the agent never hand-fixes lint.
- **Commit-time:** the `githooks/` pre-commit hook runs branch guard + `ruff` +
  type check; pre-push runs the test suite. These are the *un-evadable*
  enforcement — install per work repo with `npm run setup`. The plugins below
  are the fast pre-flight version of the same intent.
- **On demand:** the `adversary` subagent + `vsdd-review` skill (inferential
  review), and `python-maintenance` (periodic computational pass).

## Plugins

Local plugins in `plugins/`, auto-loaded at startup:

- `branch-protection` — pre-flight guard against commit/push on protected
  branches. Fast feedback only; `githooks/` is the real enforcement.
- `interactive-guard` — blocks TTY-hanging commands (`python`, `less`, …) and
  names the non-interactive alternative.
- `secrets-guard` — blocks pulling secret files (`.env`, private keys,
  credentials) into context via read/edit/write or bash readers; example/template
  env files stay readable.
- `compaction-preserver` — injects PLAN/spec/TODO/session-summary into the
  compaction prompt so they survive context trimming.
- `session-memory` — writes a git-activity summary to
  `.opencode/memory/session-summary.md` on idle (read at session start).
- `trace-logger` — appends every tool call to `.opencode/memory/trace.jsonl`
  for offline diagnostics.
- `rtk` — rewrites shell commands via `rtk rewrite` for token savings (requires
  `rtk` >= 0.23.0 on PATH; no-ops if absent). Rewrite rules live in the rtk
  Rust registry, not here.

The decision logic for the two guards lives in `lib/` as pure functions and is
unit-tested (`tests/`), so the string-matching is measured rather than assumed.

## Commands

Explicit slash commands in `commands/` wrap the review workflows:

- `/vsdd` — run the verification-driven review cycle (spec coverage + adversary).
- `/maintain` — run the conservative maintenance pass.

## Develop

```sh
npm test        # runs the guard test suite (node --test, TS via type-stripping)
npm run setup   # installs githooks into the current work repo (core.hooksPath)
```

Requires Node >= 22.6 (native TypeScript type-stripping) and `ruff` on PATH for
the formatter/hooks.
