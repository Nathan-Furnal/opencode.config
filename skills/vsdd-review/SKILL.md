---
name: vsdd-review
description: Full adversarial verification cycle for complex features. Use after implementation to verify spec fidelity and catch hidden issues.
---

# Verification Driven Development

## Prerequisites

- Implementation is functionally complete (not just compiling)
- A spec.md exists with assertion checklist format (use `spec-assertions` skill to create
  one)
- Tests exist for the behavioral contracts

## Cycle

1. **Spec coverage check**: for each assertion in spec.md, confirm a test exists.
   Report any uncovered assertions. Do not proceed until gaps are addressed.

2. **Invoke @adversary**: provide the spec.md, the diff (`git diff main`),
   and test output (`uv run pytest -v` or equivalent).

3. **Process feedback**:
   - Spec-level issues: update spec.md as a versioned delta, add tests
   - Test-level issues: fix or add tests, verify they fail against deliberately broken
     code
   - Code-level issues: fix, then re-run tests to confirm
   - Re-invoke @adversary with the fixes

4. **Repeat** until @adversary reports "No actionable issues found."

## Termination

The cycle ends when:

- Every spec assertion is covered by a test
- The adversary cannot find real problems
- Linters, type checkers, and tests all pass (enforced by the git pre-commit/pre-push
  hooks from `githooks/`, installed via `npm run setup`; LSP + the `ruff` formatter give
  the same signal live during editing)

## When NOT to use this

Do not run this for trivial changes. Reserve for complex features,
correctness-critical code, or security-sensitive work. For routine changes,
the git pre-commit/pre-push hooks provide sufficient quality gating.
