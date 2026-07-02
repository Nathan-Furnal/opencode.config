# Workflows

Short, opinionated recipes for driving this harness. The stance behind all of
them: **you are the architect and you hold the theory of the system** (Naur); the
sensors do the mechanical checking so your attention goes to the judgment the
tools can't supply (Fowler/Böckeler); keep the loop tight and the toolset small
(Ronacher, Zechner); and let an adversary with a fresh, hostile context tear the
first "done" apart before you trust it (VSDD, dollspace.gay).

Two reflexes first:

- **Sensors are automatic.** The pre-commit hook runs ruff + import contracts +
  type check; pre-push runs the tests. You don't invoke these, you just can't
  commit past them — and you never hand-fix what the formatter fixes.
- **Match effort to stakes.** Throwaway code gets a loose leash; code you'll own
  gets a spec, a review, and a theory check.

Invocation shapes: `@planner`, `@adversary`, `@security-reviewer` are subagents —
you invoke them and they run to completion and report back. `@theory-review` is
`mode: all`: switch into it and have a conversation. `/orient`, `/vsdd`,
`/maintain`, `/drift-sweep` are commands.

---

## Enter a new codebase

**When:** first time in a repo, or returning after a long gap away from it.

1. `/orient` — writes `.opencode/orientation.md`: entry points, the module map,
   the load-bearing files.
2. Switch into `@theory-review` (or run `/learning-opportunities orient`) and let
   it quiz you on the structure. Reading the code is recognition; reconstructing
   how it fits together is understanding, and only the second one sticks.
3. `memory_recall` to reload anything retained in past sessions; as you work out
   the non-obvious bits, `memory_retain` them with tags.
4. Only now start editing.

**Grounding:** you can't guide what you don't understand (dollspace's architect
stance); the theory has to be rebuilt in your head, not read off the text (Naur).

---

## Add a small feature

**When:** a change that fits in a handful of files.

1. Branch: `git checkout -b feature/<name>` — the hooks block committing on main.
2. Write the spec as assertions (the `spec-assertions` skill), one testable claim
   per line. The contract comes before the code.
3. Write the failing test first (red), then implement to green.
4. Implement with a pure core and effects pushed to the edges. Before adding a
   `try`/`except`, an `isinstance`, or a fallback, load `illegal-states` and ask
   whether the bad state can simply be made unconstructible instead.
5. Commit per logical step. The pre-commit gate (ruff + contracts + types) runs
   itself; don't pre-empt it by hand.
6. `/vsdd` — spec-coverage check, then `@adversary` reviews the diff. Loop until
   it reports "No actionable issues found."
7. Push (tests run in pre-push), open a PR.

**Grounding:** spec → test → code is VSDD (dollspace); fast mechanical feedback is
Ronacher; add nothing the spec didn't ask for (Zechner).

---

## Add a larger, multi-file feature

**When:** a change that spans modules or needs sequencing.

1. `@planner` — decomposes into ordered, independently-verifiable tasks (≤3 files
   each) in `PLAN.md`, each with a verification command. Read the plan and push
   back *before* any code exists.
2. For structural forks (a new boundary, where to place indirection) the planner
   consults `design-principles`. If you're introducing a layer, declare its
   dependency direction as an `arch-fitness` contract now, so drift is caught
   from the very first commit.
3. Work the plan one task at a time, each as the "small feature" loop above.
   Don't batch tasks — small steps stay verifiable, and the model gets lazy on
   large instructions.
4. After the final task, switch into `@theory-review` for a pass over the whole
   change. It's large and partly model-written — exactly when the theory gap
   hides behind a green test suite.

**Grounding:** plan → decompose → guide one step at a time (dollspace HUMANS.md);
evolutionary architecture kept honest by fitness functions (Fowler); understanding
as a first-class output (Naur/Hicks).

---

## Review work before merging

**When:** any diff you're about to trust — yours or the model's.

1. `/vsdd`. The `@adversary` runs on a *different* model with a hostile, fresh
   context: it grounds findings in ruff/ty/pytest output and hunts slop —
   unrequested fallbacks, swallowed exceptions, `isinstance` sprawl, branch
   accretion, and "is there a simpler version of this."
2. Fix the real findings, re-run, keep looping. Stop when the adversary can no
   longer point at a grounded problem — if it starts reaching for invented nits,
   that's your signal it's done, not a reason to keep chasing.
3. For auth, input-handling, crypto, secrets/PII, or dependency bumps, also run
   `@security-reviewer` (bandit + pip-audit + a fintech-shaped checklist).

**Grounding:** the generative-adversarial loop with a fresh, impolite reviewer is
VSDD (dollspace); assume the first "correct" version hides debt (anti-slop); a
different model decorrelates blind spots.

---

## Refactor safely

**When:** changing structure without changing behavior.

1. Make the change *easy* first. If the target structure has an architectural
   rule, encode it as an `arch-fitness` contract and get the current code green
   against it — now the refactor has a net under it.
2. Confirm behavior is pinned by tests before you move anything.
3. Refactor. Use `illegal-states` to *delete* the defensive code the new
   structure makes impossible, rather than carrying it along.
4. `@adversary` to confirm you simplified rather than relocated complexity;
   `@theory-review` if the change was large.

**Grounding:** "make the change easy, then make the easy change," leaning on
self-testing code and fitness functions (Fowler); deleting code is progress
(Zechner).

---

## Debug a failure

**When:** a test or a run is failing and you don't yet know why.

1. Load `python-debugging`. Reproduce non-interactively — `pytest -l`, batched
   `pdb` via `-c` commands, `faulthandler`. The `interactive-guard` blocks
   anything that would hang on a TTY and names the non-interactive form.
2. Bisect to the smallest failing case before theorizing.
3. Fix the cause, not the crash site: if a bad value reached the failure, push
   the check to the boundary (`illegal-states`) rather than guarding where it
   blew up.
4. Add the regression test that would have caught it.

**Grounding:** structured, observable debugging over print-and-guess (Zechner's
DAP stance; Ronacher on observability); fix causes, not symptoms.

---

## Choose hands-off vs hands-on

**When:** deciding how much leash to give the agent. This is the highest-leverage
call you make, so make it deliberately.

- **Hands-off (let it loop):** well-specified, mechanically verifiable, ephemeral
  work — a port, a performance pass, a dependency-bump sweep, a security scan.
  Success is a binary test or a clean scanner. Turn it loose and check the
  result, not every step.
- **Hands-on (stay in the loop):** anything requiring judgment or that you'll
  live with — architecture, public interfaces, data models, security decisions.
  Write the spec and the plan yourself, use the model to critique *your* design
  rather than generate it, and keep the theory in your head.

The failure mode to avoid is a hands-off loop on judgment code: each iteration
bolts on another local defense until the whole thing passes its tests and nobody
understands it.

**Grounding:** loops suit verifiable/ephemeral work, humans stay in for judgment
(Ronacher, "The Coming Loop"); the underrated skill is saying no (Zechner).

---

## Keep entropy down (periodic)

**When:** every so often on a repo you're actively developing.

1. `/drift-sweep` — reports architecture-contract drift, defensive-code accretion,
   and context rot (stale AGENTS.md or specs), then runs the memory lens:
   recurring topics become candidate repo-specific skills, and recorded
   frustrations become things to automate or remove. It proposes; you decide.
2. `/maintain` for the conservative dependency/health pass.
3. Act on the proposals on a branch; prune superseded notes with `memory_forget`.

**Grounding:** continuous attention to design plus garbage collection against
drift (Fowler / Thoughtworks); context resets and entropy resistance (dollspace).

---

None of these are sacred. The point of a small, legible harness is that you can
bend a workflow when the work demands it — and notice when you're bending it to
avoid the judgment the step existed to force.
