import { test } from "node:test"
import assert from "node:assert/strict"
import { analyzeMemory, renderReview } from "../lib/memory-analyze.ts"
import type { NoteRecord } from "../lib/memory-store.ts"

const note = (note: string, tags: string[] = [], ts = "2026-07-01T10:00:00.000Z"): NoteRecord => ({
  ts,
  note,
  tags,
})

// Why: the drift-sweep's memory lens must be deterministic and conservative —
// suggesting a skill for noise, or missing tagged friction, both erode trust.

test("empty notes produce an empty review, not errors", () => {
  const r = analyzeMemory([])
  assert.deepEqual(r.recurringTopics, [])
  assert.deepEqual(r.frustrations, [])
  assert.deepEqual(r.skillSuggestions, [])
})

test("a tag repeated >= threshold becomes a recurring topic; below stays out", () => {
  const notes = [
    note("a", ["apim"]),
    note("b", ["apim"]),
    note("c", ["apim"]),
    note("d", ["bicep"]),
    note("e", ["bicep"]),
  ]
  const r = analyzeMemory(notes) // default threshold 3
  assert.deepEqual(r.recurringTopics, [{ tag: "apim", count: 3 }])
})

test("topics sort by count desc, then tag asc (deterministic)", () => {
  const notes = [
    note("1", ["zeta"]), note("2", ["zeta"]), note("3", ["zeta"]),
    note("4", ["alpha"]), note("5", ["alpha"]), note("6", ["alpha"]),
    note("7", ["mid"]), note("8", ["mid"]), note("9", ["mid"]), note("10", ["mid"]),
  ]
  const r = analyzeMemory(notes)
  assert.deepEqual(
    r.recurringTopics.map((t) => t.tag),
    ["mid", "alpha", "zeta"],
  )
})

test("minTopicCount is configurable but floored at 2", () => {
  const notes = [note("a", ["x"]), note("b", ["x"])]
  assert.equal(analyzeMemory(notes, { minTopicCount: 2 }).recurringTopics.length, 1)
  // a threshold of 1 would make every one-off note a "recurring topic" — floored to 2
  assert.equal(analyzeMemory([note("a", ["y"])], { minTopicCount: 1 }).recurringTopics.length, 0)
})

test("frustration tags are detected and excluded from topics", () => {
  const notes = [
    note("ruff cache breaks on rename", ["gotcha"]),
    note("had to clear cache", ["gotcha"]),
    note("cache again", ["gotcha"]),
  ]
  const r = analyzeMemory(notes)
  assert.equal(r.frustrations.length, 3)
  assert.match(r.frustrations[0].reason, /tagged gotcha/)
  // "gotcha" is friction, not a topic to build a skill around by itself
  assert.deepEqual(r.recurringTopics, [])
})

test("untagged friction is caught by narrow phrasing markers", () => {
  const hits = [
    "the LSP crashed again",
    "test runner keeps flaking on CI",
    "had to manually regenerate the lockfile",
    "why does uv resolve a different Python here",
    "still broken after the driver update",
    "every time I rebase the hooks need to be reinstalled",
  ]
  const misses = [
    "decided to use import-linter for layering",
    "auth tokens live in the keyring helper",
  ]
  const r = analyzeMemory([...hits.map((h) => note(h)), ...misses.map((m) => note(m))])
  assert.equal(r.frustrations.length, hits.length)
  for (const f of r.frustrations) assert.equal(f.reason, "recurrence/annoyance phrasing")
})

test("markers require failure context: recurrence words in ordinary prose do NOT flag", () => {
  const ordinary = [
    "the auth service keeps tokens in an in-memory LRU", // 'keeps' as plain verb
    "run the migration again after seeding",             // benign 'again'
    "the retry decorator wraps the client again on reconfigure",
    "parser handles quoted fields; see test_csv again for examples",
    "config keeps defaults in defaults.toml",
  ]
  const r = analyzeMemory(ordinary.map((n) => note(n)))
  assert.deepEqual(r.frustrations, [])
})

test("frustrations sort newest first", () => {
  const r = analyzeMemory([
    note("old workaround", ["friction"], "2026-01-01T00:00:00.000Z"),
    note("new workaround", ["friction"], "2026-06-01T00:00:00.000Z"),
  ])
  assert.equal(r.frustrations[0].note, "new workaround")
})

test("suggestions: one per recurring topic, plus one when friction crosses threshold", () => {
  const notes = [
    note("a", ["apim"]), note("b", ["apim"]), note("c", ["apim"]),
    note("x again", ["friction"]), note("y again", ["friction"]), note("z again", ["friction"]),
  ]
  const r = analyzeMemory(notes)
  assert.equal(r.skillSuggestions.length, 2)
  assert.match(r.skillSuggestions[0], /apim/)
  assert.match(r.skillSuggestions[1], /friction notes/)
})

test("renderReview yields the three sections with placeholders when empty", () => {
  const out = renderReview(analyzeMemory([]))
  assert.match(out, /## Recurring topics\n- none above threshold/)
  assert.match(out, /## Friction \/ frustrations\n- none detected/)
  assert.match(out, /## Skill suggestions\n- none/)
})

test("renderReview includes dates and reasons for friction lines", () => {
  const out = renderReview(
    analyzeMemory([note("had to manually fix imports", [], "2026-05-04T12:00:00.000Z")]),
  )
  assert.match(out, /\(2026-05-04\) had to manually fix imports \[recurrence\/annoyance phrasing\]/)
})
