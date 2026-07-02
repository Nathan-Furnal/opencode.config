# Configuration

My opencode harness. Framed as **guides** (steer before acting) and **sensors**
(check after acting), after Böckeler/Fowler's harness engineering: you want both,
and the fast ones should be computational (linters, types, tests), not inferential.

See **WORKFLOWS.md** for end-to-end recipes (add a feature, review, enter a new
codebase, refactor, debug, choose hands-off vs hands-on, keep entropy down).

## Agents

`AGENTS.md` holds the always-on rules, injected every turn. Keep it lean; it
points to the `design-principles` skill for structural decisions rather than
duplicating them.

Subagents in `agents/`, each least-privileged and unable to delegate further
(`task: deny` — opencode subagent permissions are non-transitive, so this closes
the write-escalation in issue #20549):

- `planner` (Opus 4.8) — decomposition; writes only PLAN/spec/TODO, read-only
  git, consults `design-principles` + `spec-assertions`.
- `adversary` (Gemini 3.1 Pro) — hostile review on a *different* model to
  decorrelate blind spots; grounds findings in ruff/ty/pytest output; bash
  scoped to verification only; emits a rigid, severity-ordered findings list.
- `security-reviewer` (Opus 4.8, optional) — focused security pass for
  auth/input/crypto/secret/dependency changes; runs bandit + pip-audit. Delete
  it if you prefer the leaner two-agent setup.
- `theory-review` (Opus 4.8, `mode: all`) — interrogates *you*, not the code,
  after a large or LLM-generated change: retrieval-first questions about the
  design decisions, invariants, and seams of the diff, ending in a Learning
  Debt map (what you hold / what's shaky / what's a gap and how to close it).
  The one sensor pointed at the human's understanding rather than the artifact,
  after Naur's theory-building and the learning-science of the `learning-*`
  skills. Switch into it for the back-and-forth; read-only, never edits.

`temperature` is low for reviewers (0.1) and each agent has a `steps` cap to
avoid runaway loops. The `theory-review` agent runs warmer (0.5) since it needs
varied Socratic questions, not deterministic verdicts.

## Guides (feed-forward)

- `AGENTS.md` — coding rules and workflow.
- `skills/` — software-design steering (`design-principles`, `spec-assertions`,
  `vsdd-review`), architecture fitness (`arch-fitness`: functional-core /
  imperative-shell import contracts + complexity budgets) and anti-defensive
  design (`illegal-states`: parse-don't-validate, no isinstance sprawl, no
  swallowed errors), Python practice/tooling/maintenance/debugging, and the
  learning skills (`learning-goal`, `learning-opportunities`) after Dr. Cat
  Hicks's work.

## Sensors (feedback)

Deterministic quality gates, layered fast-to-slow:

- **Live:** LSP (`ruff`, `ty`) surfaces diagnostics as the agent types; the
  `ruff` formatter auto-fixes and formats each `.py` edit (`opencode.jsonc`), so
  the agent never hand-fixes lint.
- **Commit-time:** the `githooks/` pre-commit hook runs branch guard + `ruff` +
  import-linter architecture contracts (when the repo declares them — see the
  `arch-fitness` skill) + type check; pre-push runs the test suite. These are
  the *un-evadable* enforcement — install per work repo with `npm run setup`.
  Sensors that can't run are skipped with a visible `SKIPPED` line, never
  silently. The plugins below are the fast pre-flight version of the same intent.
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
- `memory` — agent-authored durable notes (`memory_retain` / `memory_recall` /
  `memory_forget`) in `.opencode/memory/notes.jsonl`, plus `memory_review`,
  which mines the notes for recurring topics (repo-skill candidates) and
  friction (annoyances to remove) — the evidence source for `/drift-sweep`.
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
- `/drift-sweep` — garbage-collection sweep: architecture drift, defensive-code
  accretion, context rot, and a memory review that proposes repo-specific
  skills from recurring topics and fixes for recorded frustrations.

## Develop

```sh
npm test        # runs the guard test suite (node --test, TS via type-stripping)
npm run setup   # installs githooks into the current work repo (core.hooksPath)
```

Requires Node >= 22.6 (native TypeScript type-stripping) and `ruff` on PATH for
the formatter/hooks.
