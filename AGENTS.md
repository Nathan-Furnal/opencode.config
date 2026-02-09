# Verification-Driven Development (VDD) Workflow

This project uses a three-agent iterative refinement workflow based on
Verification-Driven Development principles.

## The Process

```txt
┌─────────────────────────────────────────────────────────────────────┐
│                         VDD WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│   │ PLANNER  │───▶│ BUILDER  │───▶│ REVIEWER │                      │
│   └──────────┘    └──────────┘    └──────────┘                      │
│        │               ▲               │                            │
│        │               │               │                            │
│        ▼               │               ▼                            │
│   ┌──────────┐         │          ┌──────────┐                      │
│   │  HUMAN   │         │          │ APPROVED │                      │
│   │ APPROVAL │         │          │    or    │                      │
│   └──────────┘         │          │ CHANGES  │                      │
│                        │          │ REQUIRED │                      │
│                        │          └──────────┘                      │
│                        │               │                            │
│                        └───────────────┘                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

As the code progresses and when choosing an implementation, write why
an implementation was chosen and a few bullet points with the details
in an `IMPLEMENTATION_DETAILS.md` file.

## Agents

### @planner

**Purpose**: Eliminate ambiguity and ensure complete understanding before implementation.

- Decomposes tasks into atomic requirements
- Identifies edge cases and constraints
- Produces structured plans with acceptance criteria
- **Requires human approval before handoff**

Use when: Starting a new feature or task.

### @builder

**Purpose**: Implement plans using strict Test-Driven Development.

- Creates tests FIRST based on plan specifications
- Writes minimum code to make tests pass
- Refactors while maintaining passing tests
- Every single piece of code must pass linting and type checking
- Defers to reviewer upon completion

Use when: Plan is approved and ready for implementation.

### @reviewer

**Purpose**: Adversarial quality gate that ensures compliance and correctness.

- Audits against the approved plan
- Identifies missing test coverage
- Finds logic errors and edge cases
- Issues verdicts: APPROVED, CHANGES REQUIRED, or REJECTED

Use when: Implementation is complete and needs review.

## Workflow Rules

### 1. No Code Without a Plan

The builder will not begin work without an approved plan from the planner.

### 2. Human in the Loop

The planner MUST get human approval before handoff. This is not optional.

### 3. Tests First

The builder writes failing tests before writing implementation code.

### 4. Mandatory Review

All implementations go through the reviewer. No exceptions.
All code must pass tests and linting.

### 5. Iteration Until Approval

The builder-reviewer loop continues until:

- APPROVED: Code meets all criteria
- REJECTED: Fundamental issues require re-planning

## Handoff Protocols

### Planner → Human

```txt
Plan Review Required
[Structured plan]
Please confirm or request changes.
```

### Planner → Builder (after human approval)

```txt
Plan approved. Ready for handoff to @builder.
```

### Builder → Reviewer

```txt
Implementation Complete - Ready for Review
[Summary, test coverage, files changed]
@reviewer please perform a critical review.
```

### Reviewer → Builder (if changes needed)

```txt
Verdict: CHANGES REQUIRED
[Specific issues and required fixes]
```

## Agent Configuration

Agents are defined in `.opencode/agents/`:

- `planner.md` - Planning agent with read-only permissions
- `builder.md` - Building agent with controlled edit permissions
- `reviewer.md` - Review agent with read-only permissions

## Skills

Language and tooling-specific guidance should be added as skills in `.opencode/skill/` or
`~/.config/opencode/skill/`. The agents will load relevant skills as needed.

Examples of skills to add:

- Testing frameworks for your language
- Code style and conventions
- Project-specific patterns
- CI/CD integration requirements

## Principles

This workflow is built on:

1. **Anti-Slop Bias**: Assume first drafts contain hidden defects
2. **Forced Negativity**: The reviewer bypasses politeness to find real issues
3. **Linear Accountability**: Every requirement maps to tests and code
4. **Convergence**: The loop terminates when the reviewer can't find real issues

## Quick Start

1. Start with the planner: `@planner I need to implement [feature]`
2. Review and approve the plan when prompted
3. Builder implements with TDD: `@builder`
4. Reviewer critiques: `@reviewer`
5. Iterate until approved
