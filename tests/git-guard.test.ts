import { test } from "node:test"
import assert from "node:assert/strict"
import { classifyGitWrite } from "../lib/git-guard.ts"

// Given a command + current branch, When classified, Then block/allow as documented.

test("commit on a feature branch is allowed", () => {
  assert.equal(classifyGitWrite("git commit -m x", "feature/foo").block, false)
})

test("commit on main is blocked", () => {
  assert.equal(classifyGitWrite("git commit -m x", "main").block, true)
})

test("commit --amend is allowed even on main (fixups)", () => {
  assert.equal(classifyGitWrite("git commit --amend --no-edit", "main").block, false)
})

test("push while on a protected branch is blocked", () => {
  assert.equal(classifyGitWrite("git push", "release").block, true)
})

test("push of a feature branch is allowed", () => {
  assert.equal(classifyGitWrite("git push origin feature/foo", "feature/foo").block, false)
})

test("explicit push to main is blocked from any branch", () => {
  assert.equal(classifyGitWrite("git push origin main", "feature/foo").block, true)
})

test("explicit push via HEAD:main refspec is blocked", () => {
  assert.equal(classifyGitWrite("git push origin HEAD:main", "feature/foo").block, true)
})

test("env-prefixed commit on main is still caught", () => {
  // Original substring regex missed a leading `FOO=bar` prefix.
  assert.equal(classifyGitWrite("GIT_AUTHOR_NAME=x git commit -m y", "main").block, true)
})

test("global -C option before the subcommand is handled", () => {
  assert.equal(classifyGitWrite("git -C /repo commit -m x", "main").block, true)
})

test("git commit-tree plumbing is NOT treated as a commit", () => {
  // Substring `\bgit\s+commit\b` false-matches commit-tree; token match does not.
  assert.equal(classifyGitWrite("git commit-tree abc123", "main").block, false)
})

test("non-git commands are ignored", () => {
  assert.equal(classifyGitWrite("gitk --all", "main").block, false)
  assert.equal(classifyGitWrite("echo git commit", "main").block, false)
})

test("extra whitespace does not defeat detection", () => {
  assert.equal(classifyGitWrite("git   commit  -m x", "main").block, true)
})
