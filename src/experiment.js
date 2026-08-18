/* A controlled generalization experiment shared by the webpage and tests. */
(function attachExperiment(root) {
  "use strict";

  const dependencies = typeof module !== "undefined" && module.exports
    ? { ...require("./environment"), ...require("./policy") }
    : root.AgentArcade;

  const ONE_SEED = Object.freeze([101]);
  const MANY_SEEDS = Object.freeze([101, 113, 127, 139, 151, 163, 179, 191, 211, 223, 239, 251]);
  const TEST_SEEDS = Object.freeze([503, 509, 521, 523, 541, 547, 557, 563, 577, 587, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653]);

  function evaluateAccuracy(model, seeds, total = 600) {
    const test = dependencies.collectExpert(seeds, total);
    const correct = test.filter((row) => model.predict(row.x).action === row.action).length;
    return correct / test.length;
  }

  function evaluateScore(model, seeds) {
    let total = 0;
    for (const seed of seeds) {
      const world = dependencies.makeWorld(seed);
      for (let i = 0; i < 300 && !world.done; i += 1) {
        const state = dependencies.stateOf(world);
        const action = model.predict(dependencies.vector(state)).action;
        dependencies.stepWorld(world, action);
      }
      total += world.score;
    }
    return total / seeds.length;
  }

  function runGeneralizationExperiment() {
    const dataBudget = 240;
    const oneRows = dependencies.collectExpert(ONE_SEED, dataBudget);
    const manyRows = dependencies.collectExpert(MANY_SEEDS, dataBudget);
    const oneModel = dependencies.trainKnn(oneRows, 9);
    const manyModel = dependencies.trainKnn(manyRows, 9);

    return {
      oneSeedAccuracy: evaluateAccuracy(oneModel, TEST_SEEDS),
      manySeedAccuracy: evaluateAccuracy(manyModel, TEST_SEEDS),
      oneSeedScore: evaluateScore(oneModel, TEST_SEEDS.slice(0, 10)),
      manySeedScore: evaluateScore(manyModel, TEST_SEEDS.slice(0, 10)),
      design: {
        dataBudget,
        oneSeedCount: ONE_SEED.length,
        manySeedCount: MANY_SEEDS.length,
        testSeedCount: TEST_SEEDS.length,
        testRows: 600,
        k: 9,
      },
    };
  }

  const api = {
    ONE_SEED,
    MANY_SEEDS,
    TEST_SEEDS,
    evaluateAccuracy,
    evaluateScore,
    runGeneralizationExperiment,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) Object.assign(root.AgentArcade ||= {}, api);
})(typeof window !== "undefined" ? window : null);
