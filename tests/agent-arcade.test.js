"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const environment = require("../src/environment");
const policy = require("../src/policy");
const experiment = require("../src/experiment");
const app = require("../src/app");
const fs = require("node:fs");
const path = require("node:path");

test("seeded environments reproduce the same trajectory", () => {
  const first = environment.makeWorld(42);
  const second = environment.makeWorld(42);
  const actions = [0, -1, 0, 1, 1, 0, -1, 0, 0, 1, 0, -1];

  for (const action of actions) {
    environment.stepWorld(first, action);
    environment.stepWorld(second, action);
  }

  assert.deepEqual(
    { lane: first.lane, score: first.score, lives: first.lives, entities: first.entities },
    { lane: second.lane, score: second.score, lives: second.lives, entities: second.entities },
  );
});

test("balanced starter demonstrations contain all three actions", () => {
  const rows = environment.collectBalanced([11, 23, 37, 41], 12);
  const counts = rows.reduce((result, row) => {
    result[row.action] += 1;
    return result;
  }, { [-1]: 0, [0]: 0, [1]: 0 });

  assert.equal(rows.length, 36);
  assert.deepEqual(counts, { [-1]: 12, [0]: 12, [1]: 12 });
});

test("weighted k-NN follows a nearby demonstration", () => {
  const rows = [
    { x: [-1, 0, 0, 1], action: -1 },
    { x: [0, 1, 0, 1], action: 0 },
    { x: [1, 0, 0, 1], action: 1 },
  ];
  const model = policy.trainKnn(rows, 1);

  assert.equal(model.predict([0.9, 0.05, 0, 1]).action, 1);
  assert.equal(model.predict([-0.9, 0.05, 0, 1]).action, -1);
});

test("generalization experiment is controlled and deterministic", () => {
  const first = experiment.runGeneralizationExperiment();
  const second = experiment.runGeneralizationExperiment();

  assert.deepEqual(first, second);
  assert.deepEqual(first.design, {
    dataBudget: 240,
    oneSeedCount: 1,
    manySeedCount: 12,
    testSeedCount: 20,
    testRows: 600,
    k: 9,
  });
  assert.ok(first.oneSeedAccuracy >= 0 && first.oneSeedAccuracy <= 1);
  assert.ok(first.manySeedAccuracy >= 0 && first.manySeedAccuracy <= 1);
  assert.equal(experiment.ONE_SEED.some((seed) => experiment.TEST_SEEDS.includes(seed)), false);
  assert.equal(experiment.MANY_SEEDS.some((seed) => experiment.TEST_SEEDS.includes(seed)), false);
});

test("local run history keeps separate human, agent, and unseen records", () => {
  let stats = app.emptyRunStats();
  stats = app.recordRun(stats, "human", 18.5);
  stats = app.recordRun(stats, "human", 23.25);
  stats = app.recordRun(stats, "unseenAgent", 31);

  assert.deepEqual(stats.human, { runs: 2, best: 23.25, total: 41.75 });
  assert.deepEqual(stats.agent, { runs: 0, best: null, total: 0 });
  assert.deepEqual(stats.unseenHuman, { runs: 0, best: null, total: 0 });
  assert.deepEqual(stats.unseenAgent, { runs: 1, best: 31, total: 31 });
});

test("human and AI unseen attempts follow the same held-out seed sequence", () => {
  let stats = app.emptyRunStats();
  assert.equal(app.unseenSeedFor(stats, "unseenHuman", experiment.TEST_SEEDS), experiment.TEST_SEEDS[0]);
  assert.equal(app.unseenSeedFor(stats, "unseenAgent", experiment.TEST_SEEDS), experiment.TEST_SEEDS[0]);

  stats = app.recordRun(stats, "unseenHuman", 12);
  stats = app.recordRun(stats, "unseenAgent", 17);
  assert.equal(app.unseenSeedFor(stats, "unseenHuman", experiment.TEST_SEEDS), experiment.TEST_SEEDS[1]);
  assert.equal(app.unseenSeedFor(stats, "unseenAgent", experiment.TEST_SEEDS), experiment.TEST_SEEDS[1]);
});

test("the interface exposes local score comparison and both unseen controllers", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");
  assert.match(html, /Run comparison · local only/);
  assert.match(html, /Human · Unseen/);
  assert.match(html, /AI · Unseen/);
  assert.match(html, /same held-out seed sequence/);
  assert.match(source, /localStorage\.setItem/);
  assert.match(source, /mode === "human"/);
  assert.match(source, /mode === "unseen-human"/);
  assert.match(source, /if \(mode === "human" &&/);
});
