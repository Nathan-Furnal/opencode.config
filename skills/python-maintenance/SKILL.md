---
name: Python maintenance
description: Follow when asked for help maintain or update code
---

# Python maintenance

## Context

- Project root: `git rev-parse --show-toplevel`
- Current branch: `git branch --show-current`

## Your task

Run a structured codebase maintenance pass. This is a periodic health check — not a
pre-commit review. Check each section, report findings, and fix what you can.

### 1. Dependency health

Detect the project's toolchain and audit dependencies:

**Python** (if `pyproject.toml` or `requirements.txt` exists):

```bash
uv pip list --outdated 2>/dev/null || pip list --outdated 2>/dev/null || echo "skip"
```

Report: list any dependencies with known vulnerabilities or major version bumps
available.

### 2. Lint and format check

Run the full lint suite without fixing — report-only mode:

**Python**:

```bash
uv run ruff check . 2>/dev/null || uv run ruff check . 2>/dev/null
```

Count warnings and errors. If any are found, fix them.

### 3. Test suite health

Run the full test suite and assess health:

**Python**: `uv run pytest 2>/dev/null || pytest 2>/dev/null`

Report:

- Total tests, passed, failed, skipped
- Any flaky tests (if visible from output)
- Tests that are unusually slow

### 4. Dead code and stale patterns

Search the codebase for patterns that indicate maintenance debt:

```text
TODO, FIXME, HACK, XXX, DEPRECATED
```

Also search for:

- Unused imports (from lint output in step 2)
- Empty `catch` blocks or swallowed errors

For each finding, decide:

- **Fix now** if it's a quick cleanup (remove unused import, delete dead code)
- **File issue** if it requires more work

### 5. Documentation freshness

Check that key documentation files exist and aren't stale:

- `README.md` — exists?
- `CHANGELOG.md` — has entries for recent work?
- `AGENTS.md` — exists and reflects current project structure?

Read the first 20 lines of each to assess whether they're current. Flag any that
reference features or structures that no longer exist.

### 6. Build artifact cleanup

Check for build artifacts or temp files that shouldn't be tracked:

```bash
git status --ignored --short 2>/dev/null | head -20
```

Verify `.gitignore` covers common patterns for the detected language.

### 7. Print maintenance report

Print a summary using this format:

```text
Maintenance Report
==================

Dependencies:     [OK | N outdated | N vulnerable]
Lint:             [OK | N warnings | N errors]
Format:           [OK | N files need formatting]
Tests:            [N passed, N failed, N skipped]
Dead code/TODOs:  [OK | N items found]
Documentation:    [OK | N files stale]
Issue hygiene:    [OK | N issues need attention]
Build artifacts:  [OK | N items to clean]

Actions taken:
  - Fixed N lint warnings
  - Removed N dead code items
  - Created N maintenance issues

Recommended follow-ups:
  - <list of items that need human attention>
```

## Constraints

- Do not make breaking changes. Maintenance is conservative — fix warnings, remove dead
  code, update docs.
- Do not update dependency versions without checking for breaking changes first. Report
  outdated deps; only update patch versions automatically.
- Do not modify test behavior — only fix test infrastructure issues (imports, configs).
- If a fix would touch more than 10 lines, create an issue for it instead of fixing
  inline
