# Configuration

## Agents

Basic `AGENTS.md` with high level rules to follow at all times,
gets injected every time.

Specific agents in `agents` usually to enforce reviewing by another model, use different
models for planner, builder and reviewer.

## Plugins

Deterministic quality gates injected at different points of the life cycle:

- Avoid wild git pushes
- Enforce type checking/linter/tests mechanically
- QoL improvements based for memory and follow-up

## Skills

Various skills, focused on software design to steer the agents; general Python practices
and learning opportunities and goals, see [Dr. Cat Hicks](https://github.com/DrCatHicks)
work.
