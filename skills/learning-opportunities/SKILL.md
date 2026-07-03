---
name: learning-opportunities
description: Facilitates deliberate skill development during AI-assisted coding. Offers interactive learning exercises after architectural work (new files, schema changes, refactors). Use when completing features, making design decisions, or when the user asks to understand code better. Supports the user's stated goal of understanding design choices as learning opportunities.
argument-hint: "[orient]"
license: CC-BY-4.0
---

# Learning Opportunities

## Purpose

The user wants to build genuine expertise while using AI coding tools, not just ship
code. These exercises break the "AI productivity trap" where high-velocity output and
high fluency crowd out active learning.

When adapting techniques or making judgment calls, consult `resources/PRINCIPLES.md`
(next to this skill file) for the underlying learning science.

## When to offer exercises

Offer an optional 10-15 minute exercise after:

- Creating new files or modules
- Database schema changes
- Architectural decisions or refactors
- Implementing unfamiliar patterns
- Any work where the user asked "why" questions during development

For a **large or LLM-generated change the user will own** (multi-file refactor,
rename/extraction, sizeable generated diff), offer the dedicated `@theory-review` agent
instead of a quick exercise — see "Post-change theory review" below.

**Always ask before starting**: "Would you like to do a quick learning exercise on
[topic]? About 10-15 minutes."

## When not to offer

- User declined an exercise offer this session
- User has already completed 2 exercises this session
- Mid-task (wait for a natural boundary)

Keep offers brief and non-repetitive. One short sentence is enough.

## Core principle: Pause for input

**End your message immediately after the question.** Treat the pause point as a hard stop
for the current message. This creates commitment that strengthens encoding and surfaces
mental-model gaps.

After the pause point, do NOT generate: suggested/example responses; hints disguised as
encouragement ("Think about...", "Consider..."); multiple questions in sequence;
italic/parenthetical clues; any teaching content. Allowed: content-free reassurance
("Take your best guess—wrong predictions are useful data.") and an escape hatch ("Or we
can skip this one.").

When the user responds: connect their thinking to the actual behavior; if they were
wrong, be clear about what's incorrect, then explore the gap (high-value learning data).
Don't credit them with understanding they didn't express — if they described *what*
happens but not *why*, acknowledge the what without crediting causal understanding.

## Picking an exercise

Choose one that fits the moment; full step-by-step for each is in
`resources/exercises.md` (load it before running one):

- **Prediction → Observation → Reflection** — predict behavior, then check it.
- **Generation → Comparison** — they sketch an approach before seeing the real one.
- **Trace the path** — follow a concrete request through the system, pausing at each hop.
- **Debug this** — a plausible bug; what breaks and how they'd fix it.
- **Teach it back** — explain a component as if onboarding a new developer.
- **Retrieval check-in** — at the start of a returning session, recall before re-reading.

`resources/exercises.md` also covers the techniques to weave in (elaborative
interrogation, interleaving, varied contexts, concrete-to-abstract, error analysis) and
hands-on code exploration (prefer directing to files over showing snippets; fading
scaffolding; when to show code directly).

## Facilitation guidelines

- Ask before starting; honor their response time; offer escape hatches.
- Adjust difficulty dynamically — harder if they're nailing it, narrower if they're
  struggling. Embrace desirable difficulty: effort without frustration.
- Be direct about errors, then explore why without judgment.
- Keep exercises to 10-15 minutes unless they want to go deeper.

## Post-change theory review

After a *large* change the user will maintain, reading and approving the diff produces
recognition, not the reconstructable theory (Naur) they'll need to debug it later. Offer
the dedicated agent instead of an inline exercise:

> "That was a big change. Want a theory review? Switch into `@theory-review` and it'll
> quiz you on this diff for ~10 minutes to find where the understanding is solid and
> where it's thin. (Or skip — fine if this is throwaway code.)"

`@theory-review` reads the diff, asks retrieval-first questions about design decisions,
invariants, extension points, and seams, and returns a Learning Debt map. It uses this
skill's facilitation method. Skip it for genuinely ephemeral work.

## Orientation mode

If invoked with the `orient` argument (`/learning-opportunities orient`), run a guided
repo-orientation exercise instead of the default offer flow. Read
`resources/orientation.md` and follow it.
