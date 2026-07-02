import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, existsSync } from "fs"
import { join } from "path"

const root = join(import.meta.dirname, "..")
const agentsDir = join(root, "agents")
const skillPath = (name: string) => join(root, "skills", name, "SKILL.md")

// Lightweight structural checks (the full schema validation runs separately).
// These catch the common corruptions: missing frontmatter, missing required
// keys, stale/invalid model slugs, and bad permission action values.

const VALID_ACTIONS = new Set(["ask", "allow", "deny"])

for (const file of readdirSync(agentsDir).filter((f) => f.endsWith(".md"))) {
  const body = readFileSync(join(agentsDir, file), "utf8")

  test(`${file}: has a frontmatter block`, () => {
    assert.match(body, /^---\n[\s\S]*?\n---\n/, "starts with a --- frontmatter block")
  })

  const fm = body.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ""

  test(`${file}: declares description and mode`, () => {
    assert.match(fm, /\bdescription:/, "has description")
    assert.match(fm, /\bmode:\s*(subagent|primary|all)\b/, "has a valid mode")
  })

  test(`${file}: model slug is present and provider-qualified`, () => {
    const m = fm.match(/\bmodel:\s*(\S+)/)
    assert.ok(m, "has a model")
    assert.match(m![1], /^[a-z0-9-]+\/[a-z0-9.\-]+$/i, "model is provider/model form")
    // guard against the stale slug we replaced
    assert.notEqual(m![1], "opencode/claude-opus-4-6", "no stale opus-4-6 slug")
  })

  test(`${file}: uses 'steps' not the deprecated 'maxSteps'`, () => {
    assert.doesNotMatch(fm, /\bmaxSteps:/, "maxSteps is deprecated; use steps")
  })

  test(`${file}: every permission action value is ask/allow/deny`, () => {
    // match `<key>: <value>` where value is an unquoted or quoted word on its own
    for (const m of fm.matchAll(/^\s+"?[^":\n]+"?:\s*"?([a-z_]+)"?\s*$/gim)) {
      const val = m[1]
      // only assert on tokens that look like permission actions
      if (["allow", "deny", "ask", "denyy", "allowed"].includes(val) || val.startsWith("den") || val.startsWith("allo")) {
        assert.ok(VALID_ACTIONS.has(val), `${file}: invalid permission action "${val}"`)
      }
    }
  })
}

test("adversary denies task delegation (escalation fix, issue #20549)", () => {
  const fm = readFileSync(join(agentsDir, "adversary.md"), "utf8")
  assert.match(fm, /task:\s*deny/, "adversary denies task")
})

test("adversary hunts over-engineering with the named categories", () => {
  const body = readFileSync(join(agentsDir, "adversary.md"), "utf8")
  for (const cat of [
    "unrequested-fallback",
    "impossible-case-handling",
    "swallowed-error",
    "isinstance-sprawl",
    "branch-accretion",
    "simpler-alternative",
  ]) {
    assert.match(body, new RegExp(cat), `adversary reviews for ${cat}`)
  }
  assert.match(body, /illegal-states/, "adversary anchored to the illegal-states skill")
})

test("planner denies task delegation and can load design-principles", () => {
  const fm = readFileSync(join(agentsDir, "planner.md"), "utf8")
  assert.match(fm, /task:\s*deny/)
  assert.match(fm, /design-principles/)
})

test("theory-review interrogates the human, is read-only, and reuses the learning skill", () => {
  const body = readFileSync(join(agentsDir, "theory-review.md"), "utf8")
  const fm = body.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ""
  // read-only + no escalation: it must never edit, delegate, or browse
  assert.match(fm, /edit:\s*deny/)
  assert.match(fm, /task:\s*deny/)
  assert.doesNotMatch(fm, /"\*":\s*allow[\s\S]*bash/, "bash is not blanket-allowed")
  // it grounds questions in the diff but only via read-only git
  assert.match(fm, /"git diff\*":\s*allow/)
  // it must be usable interactively (primary-capable), not subagent-only
  assert.match(fm, /mode:\s*(all|primary)/)
  // it reuses the facilitation method rather than duplicating it
  assert.match(fm, /learning-opportunities/)
  // guardrail against the failure mode: interrogate the human, not the code
  assert.match(body, /interrogate the human, not the code/i)
  assert.match(body, /Learning Debt/, "surfaces gaps as Learning Debt, not code review")
})

test("learning-opportunities skill routes large changes to @theory-review", () => {
  const skillBody = readFileSync(skillPath("learning-opportunities"), "utf8")
  assert.match(skillBody, /@theory-review/)
  assert.ok(existsSync(join(agentsDir, "theory-review.md")), "theory-review agent exists")
})
