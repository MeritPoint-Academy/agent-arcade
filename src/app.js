/* Browser UI and animation. Core AI logic lives in policy.js. */
(function startAgentArcade() {
  "use strict";

  const A = window.AgentArcade;
  const $ = (id) => document.getElementById(id);
  const canvas = $("game");
  const context = canvas.getContext("2d");

  const starterRows = A.collectBalanced([11, 23, 37, 41, 59, 71, 83, 97, 109], 60);
  let userRows = [];
  let model = null;
  let mode = "human";
  let seed = 21;
  let world = A.makeWorld(seed);
  let queuedAction = A.ACTION.STAY;
  let paused = false;

  $("starterN").textContent = starterRows.length;

  function toast(message) {
    const element = $("toast");
    element.textContent = message;
    element.classList.add("on");
    clearTimeout(element.dismissTimer);
    element.dismissTimer = setTimeout(() => element.classList.remove("on"), 2200);
  }

  function updateHud() {
    $("hudScore").textContent = Math.round(world.score);
    $("hudLives").textContent = "♥ ".repeat(Math.max(0, world.lives)).trim() || "—";
    $("hudSeed").textContent = world.seed;
    $("hudRows").textContent = userRows.length;
    $("yourN").textContent = userRows.length;
  }

  function resetWorld(nextSeed) {
    seed = nextSeed;
    world = A.makeWorld(seed);
    queuedAction = A.ACTION.STAY;
    updateHud();
  }

  function modeStatus() {
    return mode === "human"
      ? "<b>Mission:</b> play for 30 seconds. Every decision becomes one state → action training row."
      : "<b>Observe:</b> watch the sensor rays, action probabilities, reward, and failure cases. The bot sees numbers—not pixels.";
  }

  function setPaused(nextPaused, announce = true) {
    if (paused === nextPaused) return;
    paused = nextPaused;
    queuedAction = A.ACTION.STAY;
    const button = $("pauseBtn");
    button.textContent = paused ? "▶ Resume Run" : "⏸ Pause Run";
    button.setAttribute("aria-pressed", String(paused));
    button.classList.toggle("paused", paused);
    canvas.classList.toggle("is-paused", paused);
    $("statusLine").innerHTML = paused
      ? "<b>Paused:</b> the game and example collection are frozen. Resume when you are ready."
      : modeStatus();
    if (announce) toast(paused ? "Run paused · examples are not being collected" : "Run resumed");
  }

  function setMode(nextMode, nextSeed = seed) {
    mode = nextMode;
    setPaused(false, false);
    resetWorld(nextSeed);
    const human = mode === "human";
    $("hudMode").textContent = human ? "HUMAN" : mode === "agent" ? "AGENT" : "UNSEEN";
    $("modeLabel").textContent = human
      ? "PLAYER RUN · COLLECT DEMONSTRATIONS"
      : mode === "agent"
        ? "AI TAKEOVER · WATCH THE POLICY"
        : "UNSEEN LEVEL · GENERALIZATION CHECK";
    $("statusLine").innerHTML = modeStatus();
  }

  function trainMine() {
    // Limit each personal action class so a long period of STAY does not
    // overwhelm all LEFT and RIGHT examples.
    const personal = [-1, 0, 1]
      .flatMap((action) => userRows.filter((row) => row.action === action).slice(-60))
      .map((row) => ({ x: row.x, action: row.action, seed: row.seed }));

    model = A.trainKnn(starterRows.concat(personal), 9);
    const counts = model.counts;
    $("trainReceipt").innerHTML = `<b>Model ready.</b> ${model.rows.length} balanced rows · LEFT ${counts[-1]} · STAY ${counts[0]} · RIGHT ${counts[1]}. No weights left this browser.`;
    toast("Agent trained in this browser");
    return model;
  }

  function queueAction(action) {
    if (mode === "human") queuedAction = action;
  }

  document.addEventListener("keydown", (event) => {
    const interactive = event.target.closest?.("button, a, input, select, textarea");
    if (!interactive && [" ", "p", "P"].includes(event.key) && !event.repeat) {
      event.preventDefault();
      setPaused(!paused);
      return;
    }
    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      event.preventDefault();
      queueAction(A.ACTION.LEFT);
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      event.preventDefault();
      queueAction(A.ACTION.RIGHT);
    }
  });
  $("pauseBtn").addEventListener("click", () => setPaused(!paused));
  $("touchLeft").addEventListener("pointerdown", () => queueAction(A.ACTION.LEFT));
  $("touchRight").addEventListener("pointerdown", () => queueAction(A.ACTION.RIGHT));
  canvas.addEventListener("pointerdown", (event) => {
    const bounds = canvas.getBoundingClientRect();
    queueAction(event.clientX - bounds.left < bounds.width / 2 ? A.ACTION.LEFT : A.ACTION.RIGHT);
  });

  $("humanBtn").addEventListener("click", () => setMode("human", 21 + (Date.now() % 400 | 0)));
  $("trainBtn").addEventListener("click", trainMine);
  $("agentBtn").addEventListener("click", () => {
    if (!model) trainMine();
    setMode("agent", 301);
  });
  $("unseenBtn").addEventListener("click", () => {
    if (!model) trainMine();
    setMode("unseen", 900 + (Date.now() % 500 | 0));
  });
  $("resetBtn").addEventListener("click", () => {
    userRows = [];
    model = null;
    setMode("human", 21);
    $("trainReceipt").innerHTML = "Press <b>Train My Agent</b>. The model will compare the current sensor vector with nearby examples and vote on the next action.";
    updateHud();
    toast("Your local demonstrations were cleared");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !paused) setPaused(true, false);
  });
  $("exportBtn").addEventListener("click", () => {
    if (!userRows.length) {
      toast("Play first—there are no personal rows to export");
      return;
    }
    const header = "seed,step,obs_dx,obs_distance,coin_dx,coin_distance,action,reward\n";
    const body = userRows.map((row) => [
      row.seed,
      row.step,
      ...row.x.map((value) => value.toFixed(4)),
      A.actionName(row.action),
      row.reward.toFixed(3),
    ].join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    link.download = "agent-arcade-demonstrations.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("CSV exported");
  });

  $("experimentBtn").addEventListener("click", () => {
    const button = $("experimentBtn");
    button.disabled = true;
    button.textContent = "Computing…";
    setTimeout(() => {
      const result = A.runGeneralizationExperiment();
      const one = result.oneSeedAccuracy * 100;
      const many = result.manySeedAccuracy * 100;
      $("barOne").style.width = `${one.toFixed(1)}%`;
      $("barMany").style.width = `${many.toFixed(1)}%`;
      $("outOne").textContent = `${one.toFixed(1)}%`;
      $("outMany").textContent = `${many.toFixed(1)}%`;
      const delta = many - one;
      const direction = delta >= 0 ? "higher" : "lower";
      $("experimentReceipt").innerHTML = `<b>Computed, not prewritten:</b> with the same 240 rows, the 12-seed policy was ${Math.abs(delta).toFixed(1)} percentage points ${direction} on 600 held-out actions. Mean game score: ${result.oneSeedScore.toFixed(1)} vs ${result.manySeedScore.toFixed(1)}. Repeat before making a broad claim.`;
      button.disabled = false;
      button.textContent = "↻ Run again";
      document.body.dataset.experimentComplete = "true";
      toast("Unseen-level test complete");
    }, 80);
  });

  function updateBrain(state, prediction) {
    $("sObsDx").textContent = state.obsDx.toFixed(2);
    $("sObsD").textContent = state.obsD.toFixed(2);
    $("sCoinDx").textContent = state.coinDx.toFixed(2);
    $("sCoinD").textContent = state.coinD.toFixed(2);

    if (!prediction) {
      $("decisionArrow").textContent = "·";
      $("decisionName").textContent = "Watching you";
      $("decisionWhy").textContent = "Your key press becomes the label.";
      [["pLeft", "vLeft"], ["pStay", "vStay"], ["pRight", "vRight"]].forEach(([bar, value]) => {
        $(bar).style.width = "0%";
        $(value).textContent = "—";
      });
      return;
    }

    const names = { [-1]: "Move left", [0]: "Hold lane", [1]: "Move right" };
    const arrows = { [-1]: "←", [0]: "•", [1]: "→" };
    $("decisionArrow").textContent = arrows[prediction.action];
    $("decisionName").textContent = names[prediction.action];
    $("decisionWhy").textContent = prediction.nearestDistance < 0.01
      ? "Near an observed example"
      : "Weighted vote among 9 neighbors";

    [["pLeft", "vLeft", -1], ["pStay", "vStay", 0], ["pRight", "vRight", 1]].forEach(([bar, output, action]) => {
      const value = prediction.probabilities[action] * 100;
      $(bar).style.width = `${value.toFixed(1)}%`;
      $(output).textContent = `${value.toFixed(0)}%`;
    });
  }

  function tick() {
    if (paused) return;
    if (world.done) {
      resetWorld(world.seed + 1);
      return;
    }

    const state = A.stateOf(world);
    let action = A.ACTION.STAY;
    let prediction = null;
    if (mode === "human") {
      action = queuedAction;
      queuedAction = A.ACTION.STAY;
    } else {
      if (!model) trainMine();
      prediction = model.predict(A.vector(state));
      action = prediction.action;
    }
    const reward = A.stepWorld(world, action);
    if (mode === "human" && (action !== A.ACTION.STAY || world.step % 2 === 0)) {
      userRows.push({ x: A.vector(state), action, reward, seed: world.seed, step: world.step });
    }
    updateBrain(state, prediction);
    updateHud();
  }

  function laneX(lane, normalizedY, center, topWidth, bottomWidth) {
    const t = A.clamp(normalizedY, 0, 1);
    const width = topWidth + (bottomWidth - topWidth) * t;
    return center - width / 2 + width * (lane + 0.5) / 3;
  }

  function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const topWidth = 225;
    const bottomWidth = 670;
    const topY = 18;

    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#081c34");
    gradient.addColorStop(1, "#040a12");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#163653";
    for (let i = 0; i < 54; i += 1) {
      const x = (i * 173 + world.seed * 29) % width;
      const y = (i * 97 + world.step * 1.2) % height;
      context.globalAlpha = 0.2 + (i % 5) / 10;
      context.fillRect(x, y, 2, 2);
    }
    context.globalAlpha = 1;

    context.beginPath();
    context.moveTo(center - topWidth / 2, topY);
    context.lineTo(center + topWidth / 2, topY);
    context.lineTo(center + bottomWidth / 2, height);
    context.lineTo(center - bottomWidth / 2, height);
    context.closePath();
    context.fillStyle = "#0a2035";
    context.fill();
    context.strokeStyle = "#28506c";
    context.lineWidth = 3;
    context.stroke();

    for (let lane = 1; lane < 3; lane += 1) {
      context.beginPath();
      context.moveTo(center - topWidth / 2 + topWidth * lane / 3, topY);
      context.lineTo(center - bottomWidth / 2 + bottomWidth * lane / 3, height);
      context.strokeStyle = "#1e5470";
      context.lineWidth = 2;
      context.setLineDash([15, 18]);
      context.stroke();
      context.setLineDash([]);
    }

    for (let marker = 0; marker < 9; marker += 1) {
      const t = (marker / 9 + world.step * 0.012) % 1;
      const y = topY + (height - topY) * t * t;
      const markerWidth = topWidth + (bottomWidth - topWidth) * t;
      context.strokeStyle = "#123650";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(center - markerWidth / 2, y);
      context.lineTo(center + markerWidth / 2, y);
      context.stroke();
    }

    const playerY = height * 0.86;
    const playerX = laneX(world.lane, 0.86, center, topWidth, bottomWidth);
    if (mode !== "human") {
      const ahead = world.entities.filter((entity) => !entity.hit && entity.y < 0.91).sort((a, b) => b.y - a.y);
      const coin = ahead.find((entity) => entity.type === "coin");
      const obstacle = ahead.find((entity) => entity.type === "hazard");
      [[coin, "#38e5ef"], [obstacle, "#ff5f8f"]].forEach(([entity, color]) => {
        if (!entity) return;
        context.strokeStyle = color;
        context.globalAlpha = 0.55;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(playerX, playerY);
        context.lineTo(laneX(entity.lane, entity.y, center, topWidth, bottomWidth), 18 + (height - 36) * entity.y);
        context.stroke();
        context.globalAlpha = 1;
      });
    }

    for (const entity of world.entities) {
      const y = 18 + (height - 36) * entity.y;
      const x = laneX(entity.lane, entity.y, center, topWidth, bottomWidth);
      const radius = 12 + 22 * A.clamp(entity.y, 0, 1);
      if (entity.type === "coin") {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = "#ffc857";
        context.shadowColor = "#ffc857";
        context.shadowBlur = 18;
        context.fill();
        context.shadowBlur = 0;
        context.strokeStyle = "#fff3bd";
        context.lineWidth = 3;
        context.stroke();
        context.fillStyle = "#6d4700";
        context.font = `900 ${Math.round(radius)}px ui-monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("C", x, y + 1);
      } else {
        context.save();
        context.translate(x, y);
        context.fillStyle = "#ff5f8f";
        context.shadowColor = "#ff5f8f";
        context.shadowBlur = 18;
        context.beginPath();
        context.moveTo(0, -radius);
        context.lineTo(radius, radius);
        context.lineTo(-radius, radius);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
        context.fillStyle = "#561226";
        context.font = `900 ${Math.round(radius * 1.05)}px ui-monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("!", 0, radius * 0.34);
        context.restore();
      }
    }

    context.save();
    context.translate(playerX, playerY);
    context.shadowColor = mode === "human" ? "#55e6a5" : "#38e5ef";
    context.shadowBlur = 26;
    context.fillStyle = context.shadowColor;
    context.beginPath();
    context.moveTo(0, -28);
    context.lineTo(25, 25);
    context.lineTo(0, 14);
    context.lineTo(-25, 25);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "#071426";
    context.fillRect(-6, -2, 12, 18);
    context.restore();

    context.fillStyle = "#9cb7ca";
    context.font = "700 14px ui-monospace";
    context.textAlign = "left";
    context.fillText(mode === "human" ? "YOU ARE THE LABELER" : "POLICY IS DRIVING", 24, 32);
    context.fillStyle = world.lastReward < 0 ? "#ff5f8f" : world.lastReward > 1 ? "#ffc857" : "#55e6a5";
    context.fillText(`reward ${world.lastReward.toFixed(2)}`, 24, 54);
    if (paused) {
      context.fillStyle = "rgba(3, 10, 18, 0.72)";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.font = "900 38px ui-monospace";
      context.textAlign = "center";
      context.fillText("PAUSED", center, height / 2 - 8);
      context.fillStyle = "#9cb7ca";
      context.font = "700 17px ui-monospace";
      context.fillText("No examples are being collected", center, height / 2 + 28);
    }
    requestAnimationFrame(draw);
  }

  setMode("human", 21);
  setInterval(tick, 100);
  requestAnimationFrame(draw);
})();
