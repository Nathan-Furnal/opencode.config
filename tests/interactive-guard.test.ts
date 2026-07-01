import { test } from "node:test"
import assert from "node:assert/strict"
import { classifyInteractive } from "../lib/interactive-guard.ts"

const ALTS: Record<string, string> = {
  python: "Use `python -c '...'` or `python script.py`",
  node: "Use `node -e '...'` or `node script.js`",
  less: "Use `cat` or `head -n 100`",
  psql: "Use `psql -c 'SQL'` for non-interactive queries",
}
const SAFE = new Set(["-c", "-e", "-m", "--version", "--help", "--batch", "--no-pager"])

const c = (cmd: string) => classifyInteractive(cmd, ALTS, SAFE)

test("bare python is blocked (would hang without a TTY)", () => {
  assert.equal(c("python").block, true)
})

test("python -c is allowed (safe flag)", () => {
  assert.equal(c("python -c 'print(1)'").block, false)
})

test("python script.py is allowed (file argument)", () => {
  assert.equal(c("python script.py").block, false)
})

test("node -e is allowed", () => {
  assert.equal(c("node -e '1+1'").block, false)
})

test("psql -c is allowed", () => {
  assert.equal(c("psql -c 'select 1'").block, false)
})

test("unknown binaries are ignored", () => {
  assert.equal(c("ls -la").block, false)
})

test("GAP CLOSED: env-prefixed python is now blocked", () => {
  // Documented limitation of the original: `FOO=bar python` slipped through.
  assert.equal(c("PYTHONPATH=/x python").block, true)
})

test("GAP CLOSED: python behind a pipe is now blocked", () => {
  // Documented limitation of the original: only the first token was checked.
  const d = c("echo 'print(1)' | python")
  assert.equal(d.block, true)
  if (d.block) assert.equal(d.binary, "python")
})

test("GAP CLOSED: interactive pager after && is blocked", () => {
  assert.equal(c("grep foo file && less other").block, true)
})

test("safe pipeline is still allowed", () => {
  assert.equal(c("cat data.txt | node -e 'process.stdin'").block, false)
})
