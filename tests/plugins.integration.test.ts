import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

import { BranchProtection } from "../plugins/branch-protection.ts"
import { InteractiveGuard } from "../plugins/interactive-guard.ts"
import { SecretsGuard } from "../plugins/secrets-guard.ts"
import { Memory } from "../plugins/memory.ts"
import { TraceLogger } from "../plugins/trace-logger.ts"
import { CompactionPreserver } from "../plugins/compaction-preserver.ts"
import { SessionMemory } from "../plugins/session-memory.ts"
import { RtkOpenCodePlugin } from "../plugins/rtk.ts"

// ---- stubs for the opencode plugin runtime -------------------------------

/** Stub the Bun shell `$`: a tagged template returning a chainable thenable. */
function makeShell(handler: (cmd: string) => { stdout?: string; fail?: boolean }) {
  return (strings: TemplateStringsArray, ...values: unknown[]) => {
    let cmd = ""
    strings.forEach((s, i) => {
      cmd += s + (i < values.length ? String(values[i]) : "")
    })
    const res = handler(cmd.trim()) || {}
    const obj: any = {
      _nothrow: false,
      quiet() { return obj },
      nothrow() { obj._nothrow = true; return obj },
      then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
        if (res.fail && !obj._nothrow) return reject(new Error("failed: " + cmd))
        resolve({ stdout: res.stdout ?? "", exitCode: res.fail ? 1 : 0 })
      },
    }
    return obj
  }
}

const tmp = () => mkdtempSync(join(tmpdir(), "occfg-"))
async function callBefore(hooks: any, tool: string, args: any) {
  await hooks["tool.execute.before"]({ tool }, { args })
}

// ---- branch-protection ----------------------------------------------------

test("branch-protection: throws on commit while on main", async () => {
  const $ = makeShell((cmd) => (cmd.includes("branch --show-current") ? { stdout: "main" } : {}))
  const hooks = await BranchProtection({ $ } as any)
  await assert.rejects(() => callBefore(hooks, "bash", { command: "git commit -m x" }), /BLOCKED/)
})

test("branch-protection: allows commit on a feature branch", async () => {
  const $ = makeShell((cmd) => (cmd.includes("branch --show-current") ? { stdout: "feature/x" } : {}))
  const hooks = await BranchProtection({ $ } as any)
  await assert.doesNotReject(() => callBefore(hooks, "bash", { command: "git commit -m x" }))
})

// ---- interactive-guard ----------------------------------------------------

test("interactive-guard: blocks bare python, allows python -c", async () => {
  const hooks = await InteractiveGuard({} as any)
  await assert.rejects(() => callBefore(hooks, "bash", { command: "python" }), /would start an interactive/)
  await assert.doesNotReject(() => callBefore(hooks, "bash", { command: "python -c 'print(1)'" }))
})

// ---- secrets-guard --------------------------------------------------------

test("secrets-guard: blocks reading .env, allows source, blocks cat .env", async () => {
  const hooks = await SecretsGuard({} as any)
  await assert.rejects(() => callBefore(hooks, "read", { filePath: ".env" }), /secrets/)
  await assert.doesNotReject(() => callBefore(hooks, "read", { filePath: "src/app.py" }))
  await assert.rejects(() => callBefore(hooks, "bash", { command: "cat .env" }), /secrets/)
})

// ---- memory (retain / recall / forget) ------------------------------------

test("memory: retain then recall then forget round-trips on disk", async () => {
  const worktree = tmp()
  const hooks: any = await Memory({} as any)
  const ctx = { worktree } as any

  const saved = await hooks.tool.memory_retain.execute({ note: "use bcrypt for hashing", tags: ["auth"] }, ctx)
  assert.match(saved, /Remembered/)
  assert.ok(existsSync(join(worktree, ".opencode", "memory", "notes.jsonl")))

  await hooks.tool.memory_retain.execute({ note: "db pool size is 20" }, ctx)

  const recallAuth = await hooks.tool.memory_recall.execute({ query: "auth" }, ctx)
  assert.match(recallAuth, /bcrypt/)
  assert.doesNotMatch(recallAuth, /pool size/)

  const recallAll = await hooks.tool.memory_recall.execute({}, ctx)
  assert.match(recallAll, /bcrypt/)
  assert.match(recallAll, /pool size/)

  const forgot = await hooks.tool.memory_forget.execute({ contains: "bcrypt" }, ctx)
  assert.match(forgot, /Forgot 1/)
  const after = await hooks.tool.memory_recall.execute({}, ctx)
  assert.doesNotMatch(after, /bcrypt/)
  assert.match(after, /pool size/)
})

// ---- trace-logger ---------------------------------------------------------

test("trace-logger: appends a JSON line for a tool call", async () => {
  const worktree = tmp()
  const $ = makeShell(() => ({}))
  const hooks: any = await TraceLogger({ $, worktree } as any)
  await hooks["tool.execute.after"](
    { tool: "bash", args: { command: "ls" } },
    { title: "list files", output: "a\nb", metadata: {} },
  )
  const line = readFileSync(join(worktree, ".opencode", "memory", "trace.jsonl"), "utf8").trim()
  const rec = JSON.parse(line)
  assert.equal(rec.tool, "bash")
  assert.equal(rec.command, "ls")
  assert.equal(rec.title, "list files")
})

// ---- compaction-preserver -------------------------------------------------

test("compaction-preserver: injects present critical files into context", async () => {
  const worktree = tmp()
  writeFileSync(join(worktree, "PLAN.md"), "step 1: do the thing")
  const hooks: any = await CompactionPreserver({ worktree } as any)
  const output: any = { context: [] }
  await hooks["experimental.session.compacting"]({ sessionID: "s" }, output)
  assert.equal(output.context.length, 1)
  assert.match(output.context[0], /PLAN\.md/)
  assert.match(output.context[0], /do the thing/)
})

test("compaction-preserver: injects nothing when no critical files exist", async () => {
  const worktree = tmp()
  const hooks: any = await CompactionPreserver({ worktree } as any)
  const output: any = { context: [] }
  await hooks["experimental.session.compacting"]({ sessionID: "s" }, output)
  assert.equal(output.context.length, 0)
})

// ---- session-memory -------------------------------------------------------

test("session-memory: writes a summary on session.idle", async () => {
  const worktree = tmp()
  const $ = makeShell((cmd) => {
    if (cmd.includes("branch --show-current")) return { stdout: "feature/x" }
    if (cmd.includes("git log")) return { stdout: "abc123 initial commit" }
    if (cmd.includes("git status")) return { stdout: " M file.py" }
    if (cmd.includes("git diff")) return { stdout: " file.py | 2 +-" }
    return {}
  })
  const client = { app: { log: async () => {} } }
  const hooks: any = await SessionMemory({ $, worktree, client } as any)
  await hooks.event({ event: { type: "session.idle" } })
  const summary = readFileSync(join(worktree, ".opencode", "memory", "session-summary.md"), "utf8")
  assert.match(summary, /feature\/x/)
  assert.match(summary, /initial commit/)
})

test("session-memory: ignores non-idle events without writing", async () => {
  const worktree = tmp()
  const $ = makeShell(() => ({}))
  const hooks: any = await SessionMemory({ $, worktree, client: { app: { log: async () => {} } } } as any)
  await hooks.event({ event: { type: "session.created" } })
  assert.equal(existsSync(join(worktree, ".opencode", "memory", "session-summary.md")), false)
})

// ---- rtk ------------------------------------------------------------------

test("rtk: disables itself (returns no hooks) when the binary is absent", async () => {
  const $ = makeShell((cmd) => (cmd.startsWith("which rtk") ? { fail: true } : {}))
  const hooks: any = await RtkOpenCodePlugin({ $ } as any)
  assert.deepEqual(hooks, {})
})

test("rtk: rewrites the command when rtk returns a different string", async () => {
  const $ = makeShell((cmd) => {
    if (cmd.startsWith("which rtk")) return { stdout: "/usr/bin/rtk" }
    if (cmd.startsWith("rtk rewrite")) return { stdout: "rg --json foo" }
    return {}
  })
  const hooks: any = await RtkOpenCodePlugin({ $ } as any)
  const args: any = { command: "grep foo" }
  await hooks["tool.execute.before"]({ tool: "bash" }, { args })
  assert.equal(args.command, "rg --json foo")
})
