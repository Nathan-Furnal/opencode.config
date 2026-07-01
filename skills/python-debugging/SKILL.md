---
name: Python debugging
description: Use when diagnosing a failing test, exception, or wrong output in Python. Prefers systematic, non-interactive debugging (reproduction, showlocals, batch pdb, faulthandler, bisection) over scattering print statements.
---

# Python debugging

Most agents debug by adding `print`, rerunning, reading output, and repeating.
That is slow and pollutes the code. Debug like you have a debugger attached —
because in a no-TTY shell you effectively can, if you use the batch techniques
below. Interactive REPLs and interactive `pdb`/`--pdb` will hang; never use them
here (the interactive-guard blocks them).

## Order of operations

1. **Reproduce minimally.** Shrink the failure to the smallest command that
   still fails: a single test, or a `python -c` one-liner. A shrinking
   reproduction is itself half the diagnosis.
2. **Read the real state at the failure**, don't guess it (see below).
3. **Form one hypothesis, test it**, then fix. Do not shotgun edits.

## Get the failure state without print statements

**Pytest, with locals and full tracebacks:**

```sh
uv run pytest path::test_name -x -l --tb=long
```

`-l/--showlocals` prints every local variable at each frame of the failing
stack — usually the single highest-signal command. `-x` stops at the first
failure so you read one clean trace.

**Batch pdb (non-interactive).** `pdb` accepts `-c` commands that run then
`continue`, so it works without a TTY. Post-mortem inspection of the crash
frame:

```sh
uv run python -m pdb -c continue -c 'bt' -c 'p some_var' -c 'quit' script.py
```

For a crash, `continue` runs to the exception, then `bt` and `p <expr>` inspect
the frame — no interactive session.

**Faulthandler for hangs and segfaults:**

```sh
uv run python -X faulthandler -X dev script.py
```

`-X dev` enables extra runtime checks; faulthandler dumps a traceback on fatal
signals and on `faulthandler.dump_traceback_later(timeout)` for hangs.

**Tracing execution path:**

```sh
uv run python -m trace --trace script.py | tail -60
```

## Bisection

When a value is wrong but nothing throws, bisect: assert the expected invariant
half-way through the pipeline with a one-off `python -c` or a temporary
`assert`, and move the assertion until it flips. This finds *where* truth
diverges from expectation far faster than reading the whole flow.

## Logging over prints (when you do need output)

If you must instrument, add a structured log line (per the python-practices
skill) rather than a bare `print`, and remove it or keep it as a real log
before committing. Prefer logging the *inputs and outputs of the suspicious
boundary*, not intermediate scalars.

## When the bug is in a dependency

Reproduce against the dependency in isolation with `python -c` before assuming
your code is wrong. Check the installed version (`uv pip show <pkg>`) against
the changelog for the behaviour you're seeing.

## Anti-patterns

- Sprinkling `print` and rerunning the whole suite each time.
- Interactive `pdb`, `ipython`, `pytest --pdb`, `breakpoint()` — they hang with
  no TTY.
- Fixing before you have read the actual failing state.
- Editing more than one hypothesis at once, so you can't tell which fix worked.
