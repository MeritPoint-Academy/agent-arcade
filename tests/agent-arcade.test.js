"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const environment = require("../src/environment");
const policy = require("../src/policy");
const experiment = require("../src/experiment");

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
