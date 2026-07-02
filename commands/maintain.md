---
description: Run a conservative Python codebase maintenance pass (hygiene, not architecture).
subtask: true
---

Run a periodic health check on this repo. This is hygiene — dependencies, lint,
tests, dead code, docs, artifacts. Architectural drift, defensive-code accretion,
and the memory review live in `/drift-sweep`; don't duplicate them here.

Focus (optional): $ARGUMENTS

Check each section, report findings, and fix only what is safe and small.

1. **Dependencies** — `uv pip list --outdated`. Report outdated and any known
   vulnerabilities. Auto-update patch versions only; report the rest.
2. **Lint & format** — `uv run ruff check .` and `uv run ruff format --check .`
   in report mode. Fix warnings if the fix is small.
3. **Tests** — `uv run pytest -q`. Report totals, failures, skips, and any
   unusually slow or flaky tests.
4. **Dead code & markers** — grep for `TODO FIXME HACK XXX DEPRECATED`, unused
   imports (from ruff), and swallowed exceptions. Fix quick cleanups inline;
   file the rest as follow-ups.
5. **Docs freshness** — do `README.md` / `AGENTS.md` / `CHANGELOG.md` still match
   the repo? Flag anything referencing removed features or structure.
6. **Artifacts** — `git status --ignored --short`; verify `.gitignore` covers the
   usual Python patterns.

Then print:

    Maintenance Report
    ==================
    Dependencies:    [OK | N outdated | N vulnerable]
    Lint/format:     [OK | N warnings | N to format]
    Tests:           [N passed, N failed, N skipped]
    Dead code/TODOs: [OK | N items]
    Docs:            [OK | N stale]
    Artifacts:       [OK | N to clean]
    Actions taken:   <what you fixed inline>
    Follow-ups:      <what needs a human / its own branch>

Constraints: no breaking changes; no dependency bumps beyond patch without
checking changelogs; don't change test behavior (only fix test infra); if a fix
would touch more than ~10 lines, file it as a follow-up instead of doing it here.
