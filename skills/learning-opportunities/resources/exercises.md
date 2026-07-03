# Exercise catalog and techniques

Detailed how-to for the exercise types named in `SKILL.md`. Load this when you're
about to run an exercise. All of these obey the pause-for-input rule in `SKILL.md`.

## Exercise types

### Prediction → Observation → Reflection

1. **Pause:** "What do you predict will happen when [specific scenario]?"
2. Wait for response
3. Walk through actual behavior together
4. **Pause:** "What surprised you? What matched your expectations?"

### Generation → Comparison

1. **Pause:** "Before I show you how we handle [X], sketch out how you'd approach it"
2. Wait for response
3. Show the actual implementation
4. **Pause:** "What's similar? What's different, and why do you think we went this
   direction?"

### Trace the path

1. Set up a concrete scenario with specific values
2. **Pause at each decision point:** "The request hits the middleware now. What happens
   next?"
3. Wait before revealing each step
4. Continue through the full path

### Debug this

1. Present a plausible bug or edge case
2. **Pause:** "What would go wrong here, and why?"
3. Wait for response
4. **Pause:** "How would you fix it?"
5. Discuss their approach

### Teach it back

1. **Pause:** "Explain how [component] works as if I'm a new developer joining the
   project"
2. Wait for their explanation
3. Offer targeted feedback: what they nailed, what to refine

### Retrieval check-in (for returning sessions)

At the start of a new session on an ongoing project:

1. **Pause:** "Quick check—what do you remember about how [previous component] handles
   [scenario]?"
2. Wait for response
3. Fill gaps or confirm, then proceed

## Techniques to weave in

**Elaborative interrogation**: Ask "why," "how," and "when else" questions

- "Why did we structure it this way rather than [alternative]?"
- "How would this behave differently if [condition changed]?"
- "In what context might [alternative] be a better choice?"

**Interleaving**: Mix concepts rather than drilling one

- "Which of these three recent changes would be affected if we modified [X]?"

**Varied practice contexts**: Apply the same concept in different scenarios

- "We used this pattern for user auth—how would you apply it to API key validation?"

**Concrete-to-abstract bridging**: After hands-on work, transfer to broader contexts

- "This is an example of [pattern]. Where else might you use this approach?"
- "What's the general principle here that you could apply to other projects?"

**Error analysis**: Examine mistakes and edge cases deliberately

- "Here's a bug someone might accidentally introduce—what would go wrong and why?"

## Hands-on code exploration

**Prefer directing users to files over showing code snippets.** Having learners locate
code themselves builds codebase familiarity and creates stronger memory traces than
passively reading.

### Completion-style prompts

Give enough context to orient, but have them find the key piece:

> Open `[file]` and find the `[component]`. What does it do with `[variable]`?

### Fading scaffolding

Adjust guidance based on demonstrated familiarity:

- **Early:** "Open `[file]`, scroll to around line `[N]`, and find the `[function]`"
- **Later:** "Find where we handle `[feature]`"
- **Eventually:** "Where would you look to change how `[feature]` works?"

Fading adjusts the difficulty of the *question setup*, not the *answer*. At every
scaffolding level — from "open file X, line N" to "where would you look?" — the learner
still generates the answer themselves. If a learner is struggling, move back UP the
scaffolding ladder (more specific question) rather than hinting at the answer.

### Pair finding with explaining

After they locate code, prompt self-explanation:

> You found it. Before I say anything—what do you think this line does?

### Example-problem pairs

After exploring one instance, have them find a parallel:

> We just looked at how `[function A]` handles `[task]`. Can you find another function
> that does something similar?

### When to show code directly

- The snippet is very short (1-3 lines) and full context isn't needed
- You're introducing new syntax they haven't encountered
- The file is large and searching would be frustrating rather than educational
- They're stuck and need to move forward
