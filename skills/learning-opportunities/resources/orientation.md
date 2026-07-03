# Orientation mode

Runs a guided repo-orientation exercise. Load and follow this only when the skill
is invoked with the `orient` argument (`/learning-opportunities orient`). All the
facilitation rules in `SKILL.md` (pause for input, fading scaffolding, wrong
predictions as data) apply here too.

## Finding the orientation file

Repo orientation is repo-specific, so it lives in the current project, not in this
skill's global directory. Look for `.opencode/orientation.md` in the project root.

If it does not exist, stop and tell the user:

> "No orientation file found. Run the `/orient` command first to generate one for this
> repo. It takes about 30 seconds."

The `/orient` command ships with this config (`commands/orient.md`) and writes
`.opencode/orientation.md` — no external plugin required.

## Running the orientation exercise

If `orientation.md` exists, read it and run through the **Suggested exercise sequence**
section it contains. Apply all standard skill techniques: pause for input after each
question, use fading scaffolding, embrace wrong predictions as learning data. The
orientation file contains repo-specific content but not full pedagogical guidance —
consult `PRINCIPLES.md` (next to this file) as needed when making facilitation
decisions.

Before starting, give the user a one-sentence summary of what the orientation covers and
ask if they want to proceed — consistent with the "always ask before starting" principle.

After the exercise sequence, ask the user: "What's one thing about this codebase that
surprised you or that you want to dig into further?" Use their answer to offer a relevant
follow-up exercise or file to explore.
