import { test } from "node:test"
import assert from "node:assert/strict"
import { classifyFileAccess, classifyBashAccess } from "../lib/secrets-guard.ts"

// --- file tools ---
test("reading .env is blocked", () => {
  assert.equal(classifyFileAccess("read", ".env").block, true)
})
test("reading .env.local is blocked", () => {
  assert.equal(classifyFileAccess("read", "config/.env.local").block, true)
})
test("reading .env.example is allowed (no secrets, shows shape)", () => {
  assert.equal(classifyFileAccess("read", ".env.example").block, false)
})
test("private keys are blocked", () => {
  assert.equal(classifyFileAccess("read", "deploy/id_ed25519").block, true)
  assert.equal(classifyFileAccess("read", "certs/server.pem").block, true)
  assert.equal(classifyFileAccess("edit", "app.key").block, true)
})
test("ordinary source files are allowed", () => {
  assert.equal(classifyFileAccess("read", "src/main.py").block, false)
  assert.equal(classifyFileAccess("write", "README.md").block, false)
})
test("non-file tools are ignored", () => {
  assert.equal(classifyFileAccess("grep", ".env").block, false)
})

// --- bash ---
test("cat .env via bash is blocked", () => {
  assert.equal(classifyBashAccess("cat .env").block, true)
})
test("grep for a key in .env is blocked", () => {
  assert.equal(classifyBashAccess("grep API_KEY .env").block, true)
})
test("env-prefixed reader is still caught", () => {
  assert.equal(classifyBashAccess("LC_ALL=C cat .env.production").block, true)
})
test("reading a normal file via cat is allowed", () => {
  assert.equal(classifyBashAccess("cat src/app.py").block, false)
})
test("cat .env.example is allowed", () => {
  assert.equal(classifyBashAccess("head .env.example").block, false)
})
test("non-reader commands touching .env are not this guard's concern", () => {
  // e.g. `rm .env` is destructive but not a context-leak; left to other controls.
  assert.equal(classifyBashAccess("ls -la .env").block, false)
})
