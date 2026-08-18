/*
 * Agent Arcade environment
 * ------------------------
 * A deterministic three-lane world used both by the game and the tests.
 * No browser APIs are used here, so students can experiment in Node too.
 */
(function attachEnvironment(root) {
  "use strict";

  const ACTION = Object.freeze({ LEFT: -1, STAY: 0, RIGHT: 1 });

  function actionName(action) {
    return action < 0 ? "LEFT" : action > 0 ? "RIGHT" : "STAY";
  }

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  // Mulberry32: a small seeded pseudo-random generator.
  function rngFor(seed) {
    let value = seed >>> 0;
    return function random() {
      value |= 0;
      value = (value + 0x6d2b79f5) | 0;
      let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
      mixed = mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeWorld(seed) {
    return {
      seed,
      rand: rngFor(seed),
      step: 0,
      lane: 1,
      score: 0,
      lives: 3,
      entities: [],
      done: false,
      lastReward: 0,
      coins: 0,
      hits: 0,
    };
  }

  function spawn(world) {
    const lane = Math.floor(world.rand() * 3);
    const type = world.rand() < 0.58 ? "coin" : "hazard";
    world.entities.push({ lane, type, y: -0.05, hit: false });

    if (type === "hazard" && world.rand() < 0.18) {
      const safeLane = (lane + 1 + Math.floor(world.rand() * 2)) % 3;
      world.entities.push({ lane: safeLane, type: "coin", y: -0.13, hit: false });
    }
  }

  function stateOf(world) {
    const ahead = world.entities.filter((entity) => !entity.hit && entity.y < 0.91);
    const nearest = (type) => ahead
      .filter((entity) => entity.type === type)
      .sort((a, b) => b.y - a.y)[0];
    const obstacle = nearest("hazard");
    const coin = nearest("coin");

    return {
      obsDx: obstacle ? (obstacle.lane - world.lane) / 2 : 0,
      obsD: obstacle ? clamp((0.88 - obstacle.y) / 0.93, 0, 1) : 1,
      coinDx: coin ? (coin.lane - world.lane) / 2 : 0,
      coinD: coin ? clamp((0.88 - coin.y) / 0.93, 0, 1) : 1,
      player: world.lane / 2,
    };
  }

  // The model receives only these four normalized sensor measurements.
  function vector(state) {
    return [state.obsDx, state.obsD, state.coinDx, state.coinD];
  }

  // A transparent rule policy generates starter labels and held-out labels.
  function expert(state, world) {
    if (state.obsD < 0.31 && Math.abs(state.obsDx) < 0.08) {
      if (Math.abs(state.coinDx) > 0.08 && state.coinD < 0.46) {
        return Math.sign(state.coinDx);
      }
      return world.lane === 0 ? ACTION.RIGHT
        : world.lane === 2 ? ACTION.LEFT
          : world.step % 2 ? ACTION.RIGHT : ACTION.LEFT;
    }
    if (state.coinD < 0.58 && Math.abs(state.coinDx) > 0.08) {
      return Math.sign(state.coinDx);
    }
    return ACTION.STAY;
  }

  function stepWorld(world, action) {
    if (world.done) return 0;

    world.step += 1;
    world.lane = clamp(world.lane + action, 0, 2);
    if (world.step % 8 === 0) spawn(world);

    const speed = 0.038 + Math.min(0.018, world.step / 22000);
    for (const entity of world.entities) entity.y += speed;

    let reward = 0.02;
    for (const entity of world.entities) {
      const collision = !entity.hit
        && entity.y >= 0.80
        && entity.y <= 0.94
        && entity.lane === world.lane;
      if (!collision) continue;

      entity.hit = true;
      if (entity.type === "coin") {
        reward += 10;
        world.score += 10;
        world.coins += 1;
      } else {
        reward -= 12;
        world.score = Math.max(0, world.score - 12);
        world.lives -= 1;
        world.hits += 1;
      }
    }

    world.entities = world.entities.filter((entity) => !entity.hit && entity.y < 1.04);
    world.score += 0.02;
    world.lastReward = reward;
    if (world.step >= 450 || world.lives <= 0) world.done = true;
    return reward;
  }

  function collectExpert(seeds, total) {
    const rows = [];
    const each = Math.ceil(total / seeds.length);

    for (const seed of seeds) {
      let world = makeWorld(seed);
      for (let i = 0; i < 34; i += 1) stepWorld(world, expert(stateOf(world), world));

      for (let i = 0; i < each && rows.length < total; i += 1) {
        if (world.done) world = makeWorld(seed + 997 + i);
        const state = stateOf(world);
        const action = expert(state, world);
        rows.push({ x: vector(state), action, seed: world.seed });
        stepWorld(world, action);
      }
    }
    return rows.slice(0, total);
  }

  function collectBalanced(seeds, perAction) {
    const bins = { [-1]: [], [0]: [], [1]: [] };
    let seedIndex = 0;
    let guard = 0;
    let world = makeWorld(seeds[0]);

    while (
      (bins[-1].length < perAction || bins[0].length < perAction || bins[1].length < perAction)
      && guard++ < 60000
    ) {
      if (world.done) {
        seedIndex = (seedIndex + 1) % seeds.length;
        world = makeWorld(seeds[seedIndex] + guard);
      }
      const state = stateOf(world);
      const action = expert(state, world);
      if (bins[action].length < perAction) {
        bins[action].push({ x: vector(state), action, seed: world.seed });
      }
      stepWorld(world, action);
    }

    return bins[-1].concat(bins[0], bins[1]);
  }

  const api = {
    ACTION,
    actionName,
    clamp,
    rngFor,
    makeWorld,
    spawn,
    stateOf,
    vector,
    expert,
    stepWorld,
    collectExpert,
    collectBalanced,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) Object.assign(root.AgentArcade ||= {}, api);
})(typeof window !== "undefined" ? window : null);
