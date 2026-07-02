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

test("/drift-sweep references only skills/tools that exist", () => {
  const body = readFileSync(join(root, "commands", "drift-sweep.md"), "utf8")
  assert.match(body, /arch-fitness/)
  assert.ok(existsSync(skill("arch-fitness")), "arch-fitness skill exists")
  assert.match(body, /illegal-states/)
  assert.ok(existsSync(skill("illegal-states")), "illegal-states skill exists")
  // the memory lens depends on the memory_review tool actually being defined
  assert.match(body, /memory_review/)
  const memPlugin = readFileSync(join(root, "plugins", "memory.ts"), "utf8")
  assert.match(memPlugin, /memory_review/, "memory plugin defines memory_review")
})

test("arch-fitness skill's contract template resource exists where it points", () => {
  const body = readFileSync(skill("arch-fitness"), "utf8")
  assert.match(body, /resources\/importlinter-fcis\.toml/)
  assert.ok(
    existsSync(join(root, "skills", "arch-fitness", "resources", "importlinter-fcis.toml")),
    "importlinter template exists",
  )
})

test("AGENTS.md points at the illegal-states skill, which exists", () => {
  const body = readFileSync(join(root, "AGENTS.md"), "utf8")
  assert.match(body, /illegal-states/)
  assert.ok(existsSync(skill("illegal-states")), "illegal-states skill exists")
})

test("pre-commit hook runs lint-imports only when contracts are declared", () => {
  const hook = readFileSync(join(root, "githooks", "pre-commit"), "utf8")
  assert.match(hook, /tool\\\.importlinter/, "hook greps for pyproject contracts")
  assert.match(hook, /avail lint-imports/, "hook probes tool availability explicitly")
  assert.match(hook, /SKIPPED/, "unavailable sensors are skipped visibly, not silently")
  assert.doesNotMatch(hook, /127/, "fragile exit-code sentinel removed")
})

test("WORKFLOWS.md references only agents/commands/skills that exist", () => {
  const body = readFileSync(join(root, "WORKFLOWS.md"), "utf8")

  // Every @agent mention must resolve to an agent file.
  const agents = new Set<string>()
  for (const m of body.matchAll(/@([a-z][a-z0-9-]+)/g)) agents.add(m[1])
  assert.ok(agents.size >= 3, "doc actually references agents")
  for (const name of agents) {
    assert.ok(existsSync(agent(name)), `@${name} referenced in WORKFLOWS.md has an agent file`)
  }

  // Every backticked /command must resolve to a command file OR a skill invoked
  // as a command (e.g. `/learning-opportunities orient`).
  const commands = new Set<string>()
  for (const m of body.matchAll(/`\/([a-z][a-z0-9-]+)/g)) commands.add(m[1])
  assert.ok(commands.size >= 3, "doc actually references commands")
  for (const name of commands) {
    const ok = existsSync(join(root, "commands", name + ".md")) || existsSync(skill(name))
    assert.ok(ok, `/${name} referenced in WORKFLOWS.md resolves to a command or skill`)
  }

  // The named skills the workflows lean on must exist.
  for (const s of ["spec-assertions", "illegal-states", "arch-fitness", "design-principles", "python-debugging"]) {
    assert.ok(existsSync(skill(s)), `WORKFLOWS.md skill ${s} exists`)
  }
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
