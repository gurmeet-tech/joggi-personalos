import { test } from "node:test";
import assert from "node:assert/strict";
import {
  todayISO,
  dateOffsetISO,
  relativeDay,
  streakFromDates,
  parseJSON,
  pct,
  clamp,
  minutesToHm,
  toHm,
  initials,
  greetingForHour,
  cn,
  youtubeIdFromUrl,
  isDirectMediaUrl,
  isValidVideoUrl,
} from "../src/lib/utils.ts";

test("todayISO returns a YYYY-MM-DD string", () => {
  assert.match(todayISO(), /^\d{4}-\d{2}-\d{2}$/);
});

test("dateOffsetISO moves forward and backward correctly", () => {
  const base = new Date(todayISO() + "T00:00:00Z");
  const plus2 = new Date(dateOffsetISO(2) + "T00:00:00Z");
  const minus2 = new Date(dateOffsetISO(-2) + "T00:00:00Z");
  assert.equal(Math.round((plus2 - base) / 86400000), 2);
  assert.equal(Math.round((minus2 - base) / 86400000), -2);
});

test("relativeDay labels today, tomorrow and yesterday", () => {
  assert.equal(relativeDay(todayISO()), "Today");
  assert.equal(relativeDay(dateOffsetISO(1)), "Tomorrow");
  assert.equal(relativeDay(dateOffsetISO(-1)), "Yesterday");
  assert.equal(relativeDay(dateOffsetISO(3)), "In 3 days");
  assert.equal(relativeDay(dateOffsetISO(-3)), "3 days ago");
});

test("streakFromDates counts consecutive days ending today", () => {
  const d = (n) => dateOffsetISO(n);
  assert.equal(streakFromDates([d(0), d(-1), d(-2)]), 3);
  assert.equal(streakFromDates([d(-1), d(-2)]), 2);
  assert.equal(streakFromDates([d(-2), d(-3)]), 0);
  assert.equal(streakFromDates([]), 0);
  assert.equal(streakFromDates([d(0), d(-2), d(-3)]), 1);
});

test("parseJSON returns fallback on bad input and parses good input", () => {
  assert.deepEqual(parseJSON("", [1]), [1]);
  assert.deepEqual(parseJSON(null, { a: 1 }), { a: 1 });
  assert.equal(parseJSON("{bad", "fb"), "fb");
  assert.deepEqual(parseJSON('{"x":2}', {}), { x: 2 });
});

test("pct rounds to one decimal and guards divide-by-zero", () => {
  assert.equal(pct(1, 3), 33.3);
  assert.equal(pct(2, 3), 66.7);
  assert.equal(pct(5, 0), 0);
});

test("clamp bounds values", () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);
});

test("time formatting helpers", () => {
  assert.equal(minutesToHm(90), "1h 30m");
  assert.equal(minutesToHm(120), "2h");
  assert.equal(minutesToHm(45), "45m");
  assert.equal(toHm(0), "00:00:00");
  assert.equal(toHm(3661), "01:01:01");
  assert.equal(toHm(10799), "02:59:59");
});

test("initials extracts up to two initials", () => {
  assert.equal(initials("Aarav Sharma"), "AS");
  assert.equal(initials("Madonna"), "M");
  assert.equal(initials("  john   doe  x "), "JD");
});

test("greetingForHour bucket boundaries", () => {
  assert.equal(greetingForHour(3), "Burning the midnight oil");
  assert.equal(greetingForHour(8), "Good morning");
  assert.equal(greetingForHour(14), "Good afternoon");
  assert.equal(greetingForHour(19), "Good evening");
  assert.equal(greetingForHour(23), "Late-night grind");
});

test("cn joins truthy classes only", () => {
  assert.equal(cn("a", false, null, undefined, "b"), "a b");
});

test("youtubeIdFromUrl recognises all common youtube URL forms", () => {
  assert.equal(youtubeIdFromUrl("https://youtu.be/CYcn9O8hkz8"), "CYcn9O8hkz8");
  assert.equal(youtubeIdFromUrl("https://www.youtube.com/watch?v=CYcn9O8hkz8"), "CYcn9O8hkz8");
  assert.equal(youtubeIdFromUrl("https://www.youtube.com/embed/CYcn9O8hkz8"), "CYcn9O8hkz8");
  assert.equal(youtubeIdFromUrl("https://www.youtube.com/shorts/CYcn9O8hkz8"), "CYcn9O8hkz8");
  assert.equal(youtubeIdFromUrl("not a url"), null);
});

test("isDirectMediaUrl detects media extensions", () => {
  assert.equal(isDirectMediaUrl("https://x.com/a/b.mp3"), true);
  assert.equal(isDirectMediaUrl("https://x.com/a/b.MP4?t=1"), true);
  assert.equal(isDirectMediaUrl("https://x.com/page"), false);
});

test("isValidVideoUrl returns structured validity", () => {
  const yt = isValidVideoUrl("https://youtu.be/CYcn9O8hkz8");
  assert.equal(yt.ok, true);
  assert.equal(yt.kind, "youtube");
  const file = isValidVideoUrl("https://cdn.example.com/rain.mp3");
  assert.equal(file.ok, true);
  assert.equal(file.kind, "file");
  assert.equal(isValidVideoUrl("").ok, false);
  assert.equal(isValidVideoUrl("ftp://x/y.mp3").ok, false);
  assert.equal(isValidVideoUrl("https://example.com/page").ok, false);
});
