import { test } from "node:test"
import assert from "node:assert/strict"
import {
  formatNote,
  parseNotes,
  filterNotes,
  renderNotes,
  removeMatching,
} from "../lib/memory-store.ts"

test("formatNote normalises tags and trims text", () => {
  const r = formatNote("  use bcrypt  ", ["Auth", " DB "], new Date("2026-01-02T03:04:05Z"))
  assert.equal(r.note, "use bcrypt")
  assert.deepEqual(r.tags, ["auth", "db"])
  assert.equal(r.ts, "2026-01-02T03:04:05.000Z")
})

test("parseNotes skips malformed lines", () => {
  const jsonl =
    JSON.stringify({ ts: "2026-01-01T00:00:00Z", note: "a", tags: [] }) +
    "\n{ broken json\n" +
    JSON.stringify({ ts: "2026-01-02T00:00:00Z", note: "b" }) +
    "\n"
  const notes = parseNotes(jsonl)
  assert.equal(notes.length, 2)
  assert.deepEqual(notes.map((n) => n.note), ["a", "b"])
})

test("filterNotes returns newest first when no query", () => {
  const notes = [
    { ts: "2026-01-01T00:00:00Z", note: "old", tags: [] },
    { ts: "2026-03-01T00:00:00Z", note: "new", tags: [] },
  ]
  assert.equal(filterNotes(notes, undefined)[0].note, "new")
})

test("filterNotes matches text and tags, all terms required", () => {
  const notes = [
    { ts: "2026-01-01T00:00:00Z", note: "token refresh is tricky", tags: ["auth"] },
    { ts: "2026-01-02T00:00:00Z", note: "db pool size", tags: ["db"] },
  ]
  assert.equal(filterNotes(notes, "auth").length, 1)
  assert.equal(filterNotes(notes, "auth token").length, 1)
  assert.equal(filterNotes(notes, "auth db").length, 0) // no note has both
})

test("filterNotes respects limit", () => {
  const notes = Array.from({ length: 5 }, (_, i) => ({
    ts: `2026-01-0${i + 1}T00:00:00Z`,
    note: `n${i}`,
    tags: [],
  }))
  assert.equal(filterNotes(notes, undefined, 2).length, 2)
})

test("renderNotes is readable and empty-safe", () => {
  assert.equal(renderNotes([]), "No matching notes.")
  const out = renderNotes([{ ts: "2026-05-05T00:00:00Z", note: "x", tags: ["a"] }])
  assert.match(out, /2026-05-05/)
  assert.match(out, /\[a\]/)
})

test("removeMatching removes by text or tag", () => {
  const notes = [
    { ts: "2026-01-01T00:00:00Z", note: "keep me", tags: ["db"] },
    { ts: "2026-01-02T00:00:00Z", note: "stale auth note", tags: ["auth"] },
  ]
  const { kept, removed } = removeMatching(notes, "auth")
  assert.equal(removed, 1)
  assert.equal(kept.length, 1)
  assert.equal(kept[0].note, "keep me")
})
