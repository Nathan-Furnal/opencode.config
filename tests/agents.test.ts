import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const root = join(import.meta.dirname, "..")
const agentsDir = join(root, "agents")

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

test("planner denies task delegation and can load design-principles", () => {
  const fm = readFileSync(join(agentsDir, "planner.md"), "utf8")
  assert.match(fm, /task:\s*deny/)
  assert.match(fm, /design-principles/)
})
