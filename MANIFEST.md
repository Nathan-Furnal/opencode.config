# Manifest

Verified against `@opencode-ai/plugin@1.17.13` (latest): `tsc --noEmit` → 0 errors,
`node --test` → 99/99; `tsc --noEmit` → 0 errors, git hooks exercised in a scratch repo.
Install by copying into `~/.config/opencode/` (and run `npm run setup` inside each work
repo for the git hooks). Requires Node ≥ 22.6 and `ruff` on PATH.

## New

- `lib/git-guard.ts` — pure branch-write classifier (tested)
- `lib/interactive-guard.ts` — pure interactive-command classifier (tested)
- `lib/secrets-guard.ts` — pure secret-file access classifier (tested)
- `lib/memory-store.ts` — pure note parse/filter/render/forget (tested)
- `plugins/secrets-guard.ts` — blocks pulling secrets into context (guard)
- `plugins/memory.ts` — agent-authored memory: retain / recall / forget tools
- `githooks/pre-commit`, `githooks/pre-push` — un-evadable branch + quality gate
- `scripts/setup.sh` — installs the git hooks via core.hooksPath
- `commands/vsdd.md`, `commands/maintain.md`, `commands/orient.md` — slash commands
- `skills/python-debugging/SKILL.md` — non-interactive debugging discipline
- `agents/security-reviewer.md` — optional focused security-review subagent
- `agents/theory-review.md` — interrogates the human's understanding after
  large/LLM-written changes (Naur theory-building + retrieval practice); mode:all,
  read-only, emits a Learning Debt map
- `WORKFLOWS.md` — end-to-end recipes tying agents/skills/commands together (Ronacher,
  Zechner, Fowler, dollspace.gay VSDD); reference-integrity tested
- `skills/learning-opportunities/SKILL.md` — added a large-change trigger + a
  "Post-change theory review" section routing to @theory-review
- `lib/memory-analyze.ts` + `tests/memory-analyze.test.ts` — pure memory-review core
  (recurring topics, friction detection, skill suggestions)
- `plugins/memory.ts` — added `memory_review` tool over the analysis core
- `skills/arch-fitness/SKILL.md` + `resources/importlinter-fcis.toml` — architecture
  fitness functions: FCIS import contracts, no-I/O-in-core, complexity budgets
- `skills/illegal-states/SKILL.md` — make illegal states unrepresentable:
  parse-don't-validate, isinstance sprawl, exception swallowing, branch accretion
  (examples executed to verify)
- `commands/drift-sweep.md` — garbage-collection sweep incl. memory lens
- `githooks/pre-commit` — import-linter contract gate (skip-if-undeclared); replaced
  fragile 127 sentinel with explicit tool availability probe; visible SKIPPED lines
- `githooks/pre-push` — same availability-probe fix for pytest
- `agents/adversary.md` — over-engineering hunt (6 named categories anchored to
  illegal-states)
- `AGENTS.md` — parse-don't-validate line now loads illegal-states before adding defenses
- `tests/*.test.ts` — unit + integration (real plugin hooks) + command validation
- `package.json`, `tsconfig.json`, `.gitignore` — reproducible toolchain

## Modified

- `opencode.jsonc` — LSP + ruff formatter (auto-fix) + permission guard
- `agents/adversary.md` — least-privilege (task/webfetch deny, scoped bash),
  tool-grounded review, rigid output, temp 0.1, steps cap
- `agents/planner.md` — current model (opus-4-8), least-privilege, task deny,
  design-principles skill
- `plugins/branch-protection.ts` — wired to tested core; git hook is enforcement
- `plugins/interactive-guard.ts` — wired to tested core; env/pipe gaps closed
- `plugins/trace-logger.ts` — fs-self-sufficient; dropped unverified exitCode field
- `plugins/session-memory.ts` — fs-self-sufficient (no Bun coupling)
- `plugins/compaction-preserver.ts` — fs-self-sufficient (readFileSync)
- `AGENTS.md` — pointer to design-principles; recall notes at session start
- `README.md` — documents rtk, quality gate, commands, secrets guard, debugging
- `skills/python-practices/SKILL.md` — fixed non-running example code
- `skills/vsdd-review/SKILL.md` — real hooks replace the phantom "pre-commit plugin"
- `skills/learning-goal/SKILL.md`, `skills/learning-opportunities/SKILL.md` —
  relative resource paths; orient reference made self-contained (local /orient)

## Unchanged from your original

- `agents/adversary.md`, `agents/planner.md`, `plugins/rtk.ts`,
  `skills/{design-principles,spec-assertions,python-tooling,python-maintenance,
  learning-goal/resources,learning-opportunities/resources}`, `.rumdl.toml`,
  `.vscode/settings.json`
