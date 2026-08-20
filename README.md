# Agent Arcade

**Teach the bot. Test the bot. Break the bot.**

Agent Arcade is a dependency-free browser game for teaching imitation learning,
interpretable AI, and controlled research design. A student plays a three-lane
game, each key press becomes a labeled example, and a weighted k-nearest-neighbors
policy takes over in the same browser.

**Live lab:** <https://meritpoint-academy.github.io/agent-arcade/>

**中文简介：** 学生先亲自玩游戏并产生 `state → action` 示范数据，再训练一个可解释的
weighted k-NN Agent。Agent 接管后，学生可以查看四个传感器、动作概率和结果，并用固定数据量
比较单一关卡与多样关卡训练对未见关卡表现的影响。

## What students can do

1. **Play:** use ← / → or A / D to collect coins and avoid hazards.
2. **Collect data:** every decision becomes a four-sensor input plus an action label.
3. **Train:** combine balanced starter demonstrations with the student's own examples.
   Pause at any time with the on-screen control, <kbd>Space</kbd>, or <kbd>P</kbd>;
   the simulation and demonstration collection freeze together.
4. **Inspect:** watch sensor values, neighbor-weighted votes, actions, and rewards.
5. **Generalize:** compare one-seed and twelve-seed policies under the same 240-row budget.
6. **Extend:** change sensors, `k`, reward rules, level distributions, or the model itself.

No account or server is involved. Demonstrations remain in memory unless the student
chooses **Export CSV**.

## Run it

You can open `index.html` directly, or serve the folder locally:

```bash
git clone https://github.com/MeritPoint-Academy/agent-arcade.git
cd agent-arcade
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

To run the dependency-free JavaScript tests:

```bash
npm test
```

## Read the code

The source is deliberately split by scientific responsibility:

```text
src/environment.js  game state, sensors, rewards, seeded levels, expert labels
src/policy.js       weighted k-NN training and prediction
src/experiment.js   controlled unseen-level evaluation
src/app.js          controls, animation, receipts, and CSV export
```

Start with [`src/policy.js`](src/policy.js). Its `trainKnn` function is the same
policy that drives the on-screen agent—not simplified pseudocode.

## The classroom experiment

> With the same 240 demonstration rows, does training on more level seeds improve
> action accuracy on unseen levels?

| Part | Fixed or changed |
|---|---|
| Independent variable | 1 training seed vs 12 training seeds |
| Fixed | 240 rows, four sensors, weighted k-NN, `k=9`, test seeds |
| Outcome | Accuracy on 600 expert-labeled actions from 20 unseen seeds |
| Secondary outcome | Mean game score on ten unseen seeds |

The result is deterministic and computed in the browser. It demonstrates one
controlled experiment; it is not evidence that level diversity always helps every agent.

## Suggested modifications

- Replace weighted k-NN with a decision tree or small neural network.
- Add velocity, lane occupancy, or recent-action sensors.
- Remove one sensor and measure what fails.
- Compare balanced and naturally imbalanced demonstrations.
- Add confidence calibration or a “do not know” action.
- Design a second game that exposes the same policy interface.

See the [teaching guide](docs/teaching-guide.md) and
[research extension](docs/research-extension.md) for structured activities.

## Open-data research extension

[`research/skillcraft1`](research/skillcraft1) reproduces a bridge from this browser
lab to a real open dataset. It downloads the
[SkillCraft1 Master Table Dataset](https://doi.org/10.24432/C5161N) from UCI at run
time, compares four interpretable telemetry features with all fifteen features under
identical five-fold splits, and saves an evidence receipt. Raw player-level data is
not committed to this repository.

## Privacy and responsible use

- No identity, camera, microphone, analytics, or network telemetry is collected.
- CSV export is initiated by the learner and stays on their device.
- This is an original sandbox game. It does not connect to or modify a commercial game.
- Use the research term **automated game-playing agent**, not a tool for bypassing
  anti-cheat or access controls.

Please report security or privacy concerns through [SECURITY.md](SECURITY.md).

## Citation and research background

Citation metadata is available in [`CITATION.cff`](CITATION.cff). Related benchmarks:

- Cobbe et al. (2020), [Leveraging Procedural Generation to Benchmark Reinforcement Learning](https://proceedings.mlr.press/v119/cobbe20a.html).
- [General Video Game AI (GVGAI)](https://github.com/GAIGResearch/GVGAI).
- Blair et al. (2013), [SkillCraft1 Master Table Dataset](https://doi.org/10.24432/C5161N), CC BY 4.0.

These projects and datasets provide research context; Agent Arcade does not copy their code.

## License

- Code is licensed under the [MIT License](LICENSE).
- Original teaching text and figures are licensed under
  [Creative Commons Attribution 4.0](LICENSE-CONTENT.md).
- Third-party citations and data terms are listed in [NOTICE.md](NOTICE.md).

Copyright © 2026 MeritPoint Academy.
