---
name: design-principles
description: Architectural decision guidance. Use when facing structural choices about module boundaries, abstraction layers, data flow, dependency direction, or when reviewing whether a design is sound.
---

# Design principles

## Decision heuristics

When facing a structural fork, work through these:

1. **What changes together lives together.** Group by rate of change, not by technical
   layer.
2. **Depend toward stability.** Volatile modules depend on stable ones, never the
   reverse.
3. **Make the implicit explicit.** If a constraint exists but isn't encoded in types or
   tests, it will be violated.
4. **Prefer data over behavior.** Model the problem as data transformations between
   immutable structures. Add behavior only when data alone can't express the constraint.
5. **One level of abstraction per function.** If a function mixes high-level
   orchestration with low-level detail, split it.
6. **The test tells you the interface.** If it's hard to test, the boundary is wrong.

## When to add indirection

Add a layer only when you can name a concrete scenario where the current
structure would force a shotgun change. "It might be useful later" is not
a scenario.

## When to refactor

Refactor when you're about to add a feature and the current structure makes the
change touch more files than the feature logically requires. Not before. Not
"while you're in there."

## Anti-patterns to flag

- God module: one file/class that everything imports
- Leaky abstraction: callers need to know implementation details
- Speculative generality: abstractions without two concrete uses
- Primitive obsession: passing raw strings/dicts where a named type would prevent misuse
