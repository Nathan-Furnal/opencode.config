---
name: Python recommended tooling
description: Use these tools when working on Python projects
---

# Python tooling

You must use these tools to interact with Python projects.

## Package manager

Use `uv`,

Adding or removing a dependency,

```sh
uv add <pkg>
uv remove <pkg>
```

Adding or removing a dev dependency,

```sh
# Adding a linter
uv add --group lint ruff
# Adding testing deps
uv add --group test pytest pytest-cov
# Removing a dev dep
uv remove --group dev requests
```

Running tests,

```sh
uv run --group test pytest
```

Running linting,

```sh
uv run --group lint ruff
```

## Linting

Use `ruff` with the maximum amount of rules. Every commit should pass the linter.

```sh
# Checking coding
uv run --group lint ruff check
# Checking code and fix
uv run --group lint ruff check --fix
# Format code
uv run --group lint ruff format
```

## Typing

Use `mypy` with maximum strictness. Every commit should pass static type checking.

```sh
# Run on one file
uv run --group lint mypy path/to/file.py
# Run in current project
uv run --group lint mypy .
```

## Testing

Use `pytest`:

- Every test file is name `test_*.py`
- Every test function is named `test_*` in the Given-When-Then style.
- Group tests of similar features together with a small top level comment describing why
  testing the feature is needed.

For property-based testing, use `hypothesis`.

## CI/CD

For CI/CD, regardless of the platform, always:

- Define a timeout for each part of the workflow/action/pipeline.
- Define specific pinned version via a commit or immutable releases.
- Never print out secrets or critical information.
- Prefer parallel operations unless sequential is more efficient.
