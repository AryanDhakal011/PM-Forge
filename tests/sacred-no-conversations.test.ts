import test from "node:test";
import assert from "node:assert/strict";
import {
  content,
  initial,
  reduce,
  type Scene,
} from "../src/lib/sacred-no/engine";
import {
  conversationFor,
  conversationPreferences,
} from "../src/lib/sacred-no/conversations";
test("every task has a short recorded introduction and an explicit next move", () => {
  const ids = new Set(content.lines.map((l) => l.id));
  for (const scene of Object.keys(content.beats) as Scene[]) {
    const plan = conversationFor({ ...initial(), scene });
    assert.ok(plan.ids.length > 0 && plan.ids.length <= 3);
    assert.ok(plan.task.length > 0);
    assert.ok(plan.finish.length > 0);
    for (const id of plan.ids) assert.ok(ids.has(id), `${scene}: ${id}`);
  }
});
test("the cold open introduces each person sequentially and ends in the real reply choice", () => {
  const plan = conversationFor(initial());
  assert.deepEqual(plan.ids, ["OPEN", "OPEN-PRIYA", "OPEN-TESS"]);
  assert.equal(plan.reply, true);
  const s = reduce(initial(), { type: "REPLY", reply: "ask" });
  const response = conversationFor(s, { type: "REPLY", reply: "ask" });
  assert.equal(response.ids[0], "REPLY-ASK");
  assert.equal(response.reply, false);
  assert.ok(response.ids.includes("G-EVIDENCE"));
});
test("evidence conversations distinguish contradiction, demand and irrelevant connections", () => {
  const s = { ...initial(), scene: "evidence" as const };
  assert.deepEqual(
    conversationFor(s, { type: "LINK", id: "load", claim: 0 }).ids,
    ["G-LINK-BREAK"],
  );
  assert.deepEqual(
    conversationFor(s, { type: "LINK", id: "tickets", claim: 3 }).ids,
    ["G-LINK-SUPPORT"],
  );
  assert.deepEqual(
    conversationFor(s, { type: "LINK", id: "load", claim: 3 }).ids,
    ["G-LINK-MISS"],
  );
});
test("turning off automatic guides keeps consequential character replies", () => {
  const s = reduce(initial(), { type: "REPLY", reply: "call" });
  assert.deepEqual(
    conversationFor(s, { type: "REPLY", reply: "call" }, false).ids,
    ["REPLY-CALL"],
  );
  assert.deepEqual(
    conversationFor({ ...s, scene: "resources" }, undefined, false).ids,
    [],
  );
  assert.equal(conversationFor(initial(), undefined, false).reply, true);
});
test("live-demo conversations use actual outcome and only show accepted partner commitments", () => {
  const s = {
    ...initial(),
    scene: "final" as const,
    demo: "crash" as const,
    lastLine: "DEMO-CRASH",
  };
  assert.deepEqual(conversationFor(s, { type: "DEMO" }).ids, [
    "DEMO-CRASH",
    "BOARD-FAIL",
    "BOARD-WARNING",
  ]);
  const agreed = { ...s, deals: ["beta"] };
  assert.equal(
    conversationFor(agreed, { type: "DEMO" }).ids.at(-1),
    "BOARD-LEDGER",
  );
});

test("the new conversation flow starts guided and manual for legacy preferences", () => {
  assert.deepEqual(conversationPreferences({ guides: false, autoPlay: true }), {
    guides: true,
    autoPlay: false,
  });
  assert.deepEqual(
    conversationPreferences({
      conversationVersion: 2,
      guides: false,
      autoPlay: true,
    }),
    { guides: false, autoPlay: true },
  );
});
