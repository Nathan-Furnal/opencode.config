---
name: design-principles
description: Architectural decision guidance. Use when facing structural choices about module boundaries, abstraction layers, data flow, dependency direction, or when reviewing whether a design is sound.
---

# Design principles

## The idea underneath the heuristics

Two ideas from Parnas generate almost everything below. **Information hiding:** a
module's boundary should hide one decision that is likely to change — its
*secret* — behind an interface that stays stable when the secret changes. You
decompose a system by asking "what is likely to change independently?" and giving
each such decision its own module, **not** by splitting along technical layers or
processing steps. **Design for change:** the changes you can name in advance are
the ones the structure must make cheap; everything else is speculation.

Two consequences worth holding onto. Undocumented design *rationale* is how
systems age (Parnas): the next person — or the next agent — can't tell which
edits preserve a module's secret and which violate it, so every "reasonable"
local change erodes the structure. And the design is a *theory* that lives in
your head (Naur); the code is its shadow. If the theory isn't captured or
rebuilt, the artifact outlives the understanding and becomes unmaintainable even
though it still runs. So: name the secret, and record why.

## Decision heuristics

When facing a structural fork, work through these:

1. **What changes together lives together.** Group by rate of change (a module's
   secret), not by technical layer. If two things always change together, they're
   one decision; if they change independently, they're two modules.
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

- God module: one file/class that everything imports — it hides no single secret,
  so nothing can change without touching it
- Leaky abstraction: callers need to know implementation details — the secret
  isn't actually hidden, so the interface can't stay stable
- Speculative generality: abstractions without two concrete uses — a "secret"
  that nothing actually keeps
- Primitive obsession: passing raw strings/dicts where a named type would prevent
  misuse
