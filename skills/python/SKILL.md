---
name: python
description: Python standards for writing and changing code — typing, tooling (uv, ruff, ty), and testing. Use when writing or modifying Python. For design choices see design-principles; to make bad states impossible see illegal-states; for layering see arch-fitness; for a failing test see python-debugging.
---

# Python

Standards for writing and changing Python here: typing, tooling, and testing.
This skill deliberately does not repeat the design guides — reach for those
directly:

- Making invalid states unconstructible (parse don't validate, no defensive
  handling of impossible cases): `illegal-states`.
- Functional core / imperative shell and dependency layering: `arch-fitness`.
- Module boundaries and when to add indirection: `design-principles`.
- Diagnosing a failing test, exception, or wrong output: `python-debugging`.

## Tooling

One toolchain, driven through `uv`:

```sh
uv add <pkg>                     # dependency
uv add --group lint ruff ty      # dev dependency
uv run ruff check --fix          # lint (+ autofix)
uv run ruff format               # format
uv run ty check                  # type check (or mypy if the project uses it)
uv run pytest                    # tests
```

Every commit passes ruff and the type checker — the pre-commit hook enforces it.
Use `ruff` with a wide rule set and don't hand-fix what `--fix` fixes; run the
type checker at maximum strictness. The LSP and the commit gate both use `ty`, so
keep a project on one checker rather than mixing ty and mypy.

## Typing

The high-signal rules (full reference: typing.python.org best practices):

- **`object`, not `Any`, for "accepts anything."** If a value is only passed to
  `str()`, or a callback's return is ignored, annotate `object`. Reserve `Any`
  for types the system genuinely cannot express.
- **Arguments abstract, returns concrete.** Accept `Iterable` / `Mapping` /
  `Sequence` (or `object` for truly anything); return `list` / `dict`. Judge
  protocol and ABC return types case by case.
- **`X | None`, with `None` last.** Use `str | int`, `str | None` — not
  `Union` / `Optional`, not `None | str`. `float` already covers `int | float`.
- **Built-in generics.** `list[str]`, `type[C]`, `collections.abc.Iterable` —
  not `List`, `Type`, `typing.Iterable`.
- **`TypeAlias` only for type aliases**, never for value aliases (`Path =
  pathlib.Path` stays unannotated).
- **Avoid union *return* types** — they force `isinstance` at the call site; use
  a closed union + `match` instead (see `illegal-states`).
- New object types are `@dataclass(frozen=True, kw_only=True)` with types
  constrained as tightly as possible. Create new exception types only for real
  business-logic cases; otherwise reuse builtins.

## Testing

- `pytest`; files `test_*.py`, functions `test_*`, in Given-When-Then shape.
  Group related tests under a one-line comment saying why the feature needs
  testing.
- Unit tests are atomic, test interfaces not implementation, and contain no logic
  of their own. Mock only external systems, and only as a last resort.
- Integration tests assert start state → end state (not interactions), never
  touch production (use containers / dev environments), and should leave the
  reader understanding the system better.
- Use `hypothesis` for property-based testing of anything with an invariant.

## Logging & security (Python-specific)

- Structured logging with a defined schema; log immediately before and after
  effectful operations; skip trivial and user-facing messages. Always keep rare
  events, sample frequent ones.
- Sanitize at untrusted boundaries (network, external systems). Strip passwords
  and credentials from object `__repr__` / `__str__`. Never commit `.env` (the
  secrets-guard plugin enforces this). Separate config per environment, and keep
  cryptography libraries current.
