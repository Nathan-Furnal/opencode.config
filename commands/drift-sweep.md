---
description: Garbage-collection sweep - detect architectural drift, defensive-code accretion, context rot, and mine project memory for skill candidates and recurring frustrations.
subtask: true
---

Run a drift sweep over the repository. This is the slow-cadence counterpart to
the per-commit gates: fitness functions prevent drift at the commit level; this
sweep finds what accumulated between checks. Scope: $ARGUMENTS (default: whole
repo).

Gather evidence first; run every applicable probe before drawing conclusions.

## 1. Structural drift (computational)

- `uv run lint-imports` — if contracts exist, report violations. If the repo
  has a core/shell (or layered) structure but NO contracts, flag that as a
  finding: the architecture is undeclared and therefore unenforced (see the
  `arch-fitness` skill).
- `uv run ruff check --statistics` — look at the distribution, not individual
  hits: clusters of `C901`/`PLR0912` mark modules accreting branches;
  `BLE001`/`S110`/`S112`/`E722` mark exception swallowing.
- Duplication: `uv run pylint --disable=all --enable=duplicate-code .` if
  pylint is available; otherwise report duplication as unchecked — do not
  install tools during a sweep.

## 2. Defensive-code accretion (inferential)

Sample the 3 most-churned Python files (`git log --since="3 months ago"
--name-only --pretty=format: | sort | uniq -c | sort -rn | head`). Review each
against the `illegal-states` skill: isinstance outside boundary parsers,
handlers for states upstream parsing rules out, unrequested fallbacks. These
are judgment calls — mark them `[review]`, not `[fix]`.

## 3. Context rot

- Every file path, command, and skill referenced in `AGENTS.md` still exists
  and is accurate; instructions match current reality (e.g. tool names,
  directory layout).
- `.opencode/memory/session-summary.md` describes the current state of work,
  not a finished or abandoned effort.
- Stale specs: assertions in `spec.md` that tests no longer cover or that
  describe removed features.

## 4. Memory lens

Call `memory_review`. Notes only capture friction the agent chose to retain, so
also probe the raw trace for friction nobody wrote down: in
`.opencode/memory/trace.jsonl`, look for the same bash command appearing many
times (`jq -r 'select(.tool=="bash") | .command' .opencode/memory/trace.jsonl |
sort | uniq -c | sort -rn | head`) — a command re-run constantly is either a
missing automation or a missing guide. Then:

- For each recurring topic: check whether a skill for it already exists in the
  global config; if not, propose a repo-specific skill (`.opencode/skills/` in
  this repo) and draft its outline — name, description, the 3-5 things the
  notes keep re-learning.
- For each friction note: classify it as (a) automatable — propose the hook,
  alias, or config change that removes it; (b) a missing guide — fold it into
  the proposed skill; or (c) upstream/unfixable — recommend `memory_forget` if
  stale.
- Propose pruning: notes superseded by code changes or duplicating what a
  skill now covers.

## Report

Emit exactly this structure:

    # Drift report — <date>
    ## Blockers (broken contracts, failing gates)
    ## Drift (structural findings with file:line and the sensor that found them)
    ## Defensive accretion ([review] items with rationale)
    ## Context rot (stale docs/specs/memory)
    ## Memory insights (proposed skills with outlines; frustrations with fixes; prunes)
    ## Proposed actions (ordered, each with its verification command)

Then STOP and wait for the human to choose actions. Do not fix anything in the
sweep itself: mechanical fixes go to a cleanup branch after approval; judgment
items go to the human. A sweep that silently rewrites code is drift with extra
steps.
