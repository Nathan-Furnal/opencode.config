---
name: arch-fitness
description: Architecture fitness functions for Python projects. Use when setting up a new project, when adding import-linter contracts, when a `lint-imports` or complexity (C901/PLR091x) gate failure occurs, or when structuring code as functional core / imperative shell.
---

# Architecture fitness functions

An architecture fitness function is an automated check that a specific
architectural decision still holds, so structural drift is caught at the commit
where it starts instead of compounding silently. These are computational
sensors: deterministic, fast, and enforced by the pre-commit hook — unlike
review feedback, they cannot be argued with.

Two are wired into this harness:

1. **Dependency-direction contracts** (`import-linter`) — enforced by the
   pre-commit hook whenever the repo declares contracts.
2. **Complexity budgets** (ruff `C901`, `PLR091x`) — enforced by the existing
   `ruff check` gate whenever the repo enables the rules.

Duplication detection is intentionally NOT per-commit (too slow); it runs in
`/drift-sweep`.

## Functional core, imperative shell

The layering this harness defaults to: a pure **core** (data transformations,
decisions, no I/O) surrounded by a thin imperative **shell** (filesystem,
network, database, clock, environment). The shell calls the core; the core
never imports the shell and never imports I/O modules. Benefits: the core is
trivially testable (including property-based testing with Hypothesis), and side
effects are confined to one auditable layer.

Structure a project like:

```text
myproject/
  core/        # pure: types, parsing, decisions, transformations
  shell/       # imperative: cli, http, db, fs — imports core, never vice versa
```

Then declare the contracts in `pyproject.toml`. Copy the template from
[resources/importlinter-fcis.toml](resources/importlinter-fcis.toml) and adjust
module names:

```toml
[tool.importlinter]
root_package = "myproject"
# Required when contracts forbid external packages (stdlib/third-party):
include_external_packages = true

# Core must not import the shell (dependency direction).
[[tool.importlinter.contracts]]
name = "Core is independent of the shell"
type = "forbidden"
source_modules = ["myproject.core"]
forbidden_modules = ["myproject.shell"]

# Core must not do I/O at all (minimize side effects mechanically).
[[tool.importlinter.contracts]]
name = "Core performs no I/O"
type = "forbidden"
source_modules = ["myproject.core"]
forbidden_modules = [
  "os", "sys", "io", "pathlib", "subprocess", "socket",
  "shutil", "tempfile", "sqlite3", "http", "urllib",
  "requests", "httpx", "aiohttp", "asyncio",
]
```

Install it as a dev dependency and the gate activates automatically:

```sh
uv add --group lint import-linter
uv run lint-imports          # what the pre-commit hook runs
```

For layered apps (api → services → domain, never upward), use a `layers`
contract instead — see the template file.

## Complexity budgets

Enable the budget rules in the repo's ruff config; the existing lint gate then
enforces them. In `pyproject.toml`:

```toml
[tool.ruff.lint]
extend-select = [
  "C901",    # function complexity over budget
  "PLR0911", # too many return statements
  "PLR0912", # too many branches
  "PLR0913", # too many arguments
  "PLR0915", # too many statements
]

[tool.ruff.lint.mccabe]
max-complexity = 10
```

When a budget fires, the fix is decomposition or redesign — extract pure
functions, replace branch chains with data (dispatch tables, pattern matching
on a closed type), or parse earlier so impossible cases disappear (see the
`illegal-states` skill). Never fix it by adding a `# noqa` — a suppressed
sensor is worse than no sensor because it reports green.

## When a contract failure occurs

1. Read which contract broke and which import crosses the boundary.
2. The fix is almost always to move the code, not the contract: hoist the
   effect to the shell and pass values in, or invert the dependency by having
   the shell inject data/functions into the core.
3. Only change a contract deliberately, with a stated reason, as its own
   commit — that is an architecture decision, not a lint fix.

## Guardrails

- Do not add contracts speculatively; encode decisions the project has actually
  made (start with the two FCIS contracts above).
- Keep contracts few and load-bearing. Ten contracts nobody understands is
  drift with extra steps.
