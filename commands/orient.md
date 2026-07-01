---
description: Generate a repo orientation file for the learning-opportunities skill.
subtask: true
---

Generate `.opencode/orientation.md` for the current repository. This is a
one-time, ~30-second scan that the `learning-opportunities` skill's orientation
mode later reads. Do not run the learning exercise now — only write the file.

Inspect the repo (entry points, build/test commands, top-level modules, and the
main data/control flow) using read/grep/glob, then write `.opencode/orientation.md`
with exactly these sections:

    # Orientation: <repo name>

    ## What this repo does
    <2-3 sentences>

    ## Entry points
    - <file>: <what starts here>

    ## Key modules
    - <path>: <responsibility>

    ## How to run and test
    - <commands>

    ## Suggested exercise sequence
    1. Trace the path: <a concrete request and where it enters>
    2. Find the code: where is <a key feature> handled?
    3. Predict: what happens when <a specific edge case>?

Keep each section short and repo-specific. Write the file and stop; report only
that it was written.
