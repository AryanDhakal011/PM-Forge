import assert from "node:assert/strict";
import test from "node:test";
import { layoutStars } from "../src/lib/product/todayGeometry";
import { isWarmupReady } from "../src/lib/product/todayWarmup";

test("constellation geometry is deterministic and clear of the center", () => {
  const first = layoutStars();
  const second = layoutStars();
  assert.equal(first.length, 63);
  assert.deepEqual(first, second);
  for (const star of first) {
    assert.ok(Math.hypot(star.x - 210, star.y - 188) > 64);
    assert.ok(star.x >= 0 && star.x <= 420);
    assert.ok(star.y >= 0 && star.y <= 380);
  }
});

test("warm-up guard rejects authoring metadata and short warm-up content", () => {
  assert.equal(isWarmupReady({
    question: "Which signal would most change your decision?",
    options: [{ id: "1", label: "Fix the funnel first" }, { id: "2", label: "Wait for more evidence" }],
  }), true);
  assert.equal(isWarmupReady({
    question: "RF 3 MCQ → clarify the goal",
    options: [{ id: "1", label: "A" }, { id: "2", label: "B" }],
  }), false);
  assert.equal(isWarmupReady({
    question: "Which option is best?",
    options: [{ id: "1", label: "fix re-verification friction (reminders, grace period) plus a graduation offer" }, { id: "2", label: "Wait" }],
  }), false);
});
