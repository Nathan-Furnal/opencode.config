---
name: spec-assertions
description: Turn a feature request into a checklist of testable assertions before any code is written. Use when starting a feature, pinning down requirements, or when @planner or the /vsdd cycle needs a spec.md to verify against.
---

# Specifications assertions

Specs are assertion checklists, not prose documents. This prevents the review
bottleneck where prose specs change in untrackable ways during refinement.

## Format

Write specs as `spec.md` in the project or feature directory:

    # Feature: <name>

    ## Behavioral contracts
    - [ ] <function/endpoint> does <X> when given <Y>
    - [ ] <function/endpoint> raises <E> when <condition>

    ## Edge cases
    - [ ] <boundary condition>: <expected behavior>

    ## Non-functional
    - [ ] <measurable constraint>

## Rules

- One assertion per line. Each must be independently testable.
- Checkboxes track test coverage: check when a passing test exists for that assertion.
- No prose paragraphs. If context is needed, put it in a one-line comment above the
  assertion.

## Refining specs

Never rewrite the spec in place. Append a version delta:

    ## v2 (after review by @adversary)
    - Added: concurrent access handling for token refresh
    - Changed: error type for malformed input (ValueError -> InvalidTokenError)
    - Removed: p99 latency requirement (moved to integration spec)

The assertion list above is updated to reflect the current state.
The version log records why each change was made.

## Convergence

The spec is done when:

- Every assertion maps to at least one test
- The adversary can only find wording nits, not missing behavior
- No assertion is ambiguous enough to have two valid interpretations
