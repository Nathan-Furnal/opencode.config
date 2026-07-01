import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"

const root = join(import.meta.dirname, "..")
const skill = (name: string) => join(root, "skills", name, "SKILL.md")
const agent = (name: string) => join(root, "agents", name + ".md")

test("every command file has a description in valid frontmatter", () => {
  for (const f of readdirSync(join(root, "commands"))) {
    const body = readFileSync(join(root, "commands", f), "utf8")
    assert.match(body, /^---\n[\s\S]*?description:/m, `${f} missing frontmatter description`)
  }
})

test("/vsdd references only skills/agents that exist", () => {
  const body = readFileSync(join(root, "commands", "vsdd.md"), "utf8")
  assert.match(body, /vsdd-review/)
  assert.ok(existsSync(skill("vsdd-review")), "vsdd-review skill exists")
  assert.match(body, /spec-assertions/)
  assert.ok(existsSync(skill("spec-assertions")), "spec-assertions skill exists")
  assert.match(body, /@adversary/)
  assert.ok(existsSync(agent("adversary")), "adversary agent exists")
  assert.match(body, /@security-reviewer/)
  assert.ok(existsSync(agent("security-reviewer")), "security-reviewer agent exists")
})

test("/maintain references the python-maintenance skill, which exists", () => {
  const body = readFileSync(join(root, "commands", "maintain.md"), "utf8")
  assert.match(body, /python-maintenance/)
  assert.ok(existsSync(skill("python-maintenance")), "python-maintenance skill exists")
})

test("orient reference is self-contained: skill points at the local command, which exists", () => {
  const skillBody = readFileSync(skill("learning-opportunities"), "utf8")
  // no dangling external references remain
  assert.doesNotMatch(skillBody, /mcmullarkey\/orient/, "external orient plugin ref removed")
  assert.doesNotMatch(skillBody, /orient:orient/, "external /orient:orient ref removed")
  assert.doesNotMatch(skillBody, /github\.com\/DrCatHicks/, "external PRINCIPLES url removed")
  // it points at the local command, which exists
  assert.match(skillBody, /commands\/orient\.md/)
  assert.ok(existsSync(join(root, "commands", "orient.md")), "local /orient command exists")
})

test("learning skills' PRINCIPLES resources exist where the skills now point (relative)", () => {
  for (const s of ["learning-goal", "learning-opportunities"]) {
    assert.ok(
      existsSync(join(root, "skills", s, "resources", "PRINCIPLES.md")),
      `${s}/resources/PRINCIPLES.md exists`,
    )
  }
})
