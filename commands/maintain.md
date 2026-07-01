---
description: Run a conservative codebase maintenance pass.
subtask: true
---

Run the `python-maintenance` skill as a periodic health check on this repo.

Focus (optional): $ARGUMENTS

Follow the skill's sections (dependency health, lint/format, test health, dead
code/TODOs, docs freshness, build artifacts) and print its maintenance report.
Only fix what is safe and small per the skill's constraints; file the rest as
follow-ups.
