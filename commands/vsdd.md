---
description: Run the verification-driven review cycle on the current work.
subtask: true
---

Run the Verification Driven Development cycle on the current work.

Reserve this for complex features, correctness-critical code, or
security-sensitive work. For routine changes the pre-commit/pre-push hooks are
sufficient gating — don't run the full cycle on trivial diffs.

Scope: $ARGUMENTS

Steps:
1. Confirm a `spec.md` exists in assertion-checklist form (use the
   `spec-assertions` skill to create one if missing).
2. Check every spec assertion maps to a test; report uncovered assertions.
3. Invoke `@adversary` with the spec, `git diff main`, and the test output.
   For auth, input-handling, crypto, secret/PII, or dependency changes, also
   invoke `@security-reviewer`.
4. Process feedback (spec / test / code) and re-invoke until the adversary
   reports "No actionable issues found."
5. Confirm ruff, the type checker, and tests pass (the git pre-commit hook
   enforces this on commit).

Report the outcome tersely: assertions covered, adversary findings addressed,
gate status.
