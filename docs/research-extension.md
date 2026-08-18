# From browser game to a research artifact

The game is a teaching environment, but its research pipeline is real:

```text
question → operational variables → demonstrations → policy → held-out evaluation
         → evidence receipt → bounded claim → new experiment
```

## Extension 1: generalization learning curve

Instead of comparing only one and twelve training seeds, preregister:

- training diversity: 1, 2, 4, 8, and 12 seeds;
- data budgets: 60, 120, 240, and 480 rows;
- repeated seed selections for each cell;
- primary outcome: unseen-seed action accuracy;
- secondary outcomes: game score, collision rate, and calibration;
- same sensors, policy hyperparameters, and held-out test protocol.

This separates the effects of demonstration quantity and level diversity and creates
a publishable learning-curve figure rather than a single comparison.

## Extension 2: sensor ablation

Start with all four sensors, then remove one at a time. Record which failure modes
increase. The experiment connects predictive performance to an interpretable design
question: what does the agent need to observe?

## Extension 3: policy comparison

Keep demonstrations and test seeds fixed while comparing weighted k-NN with:

- multinomial logistic regression;
- a shallow decision tree;
- a small multilayer perceptron; or
- a policy that can abstain when neighbors are far away.

Report accuracy together with model size, inference time, calibration, and the form
of explanation available to a student.

## Open-data bridge: SkillCraft1

The optional [`research/skillcraft1`](../research/skillcraft1) example asks how much
predictive performance is lost when a high-skill player classifier uses four
interpretable telemetry features rather than all fifteen available features.

The purpose is not to claim that the browser game and StarCraft II are the same.
It demonstrates that the same research habits transfer:

1. define an operational target;
2. cite and license the data;
3. keep evaluation splits identical;
4. save fold-level outputs;
5. distinguish association from causation;
6. give generative AI an evidence receipt rather than asking it to invent results; and
7. end with a controlled next experiment.

## Suggested artifact ladder

| Stage | Student artifact |
|---|---|
| Workshop | Agent Research Card with question, variables, result, and limitation |
| Course project | Reproducible repository, protocol, tests, and figure |
| Poster/abstract | Bounded claim, documented methods, uncertainty, and references |
| Conference paper | Repeated experiments, baselines, ablations, and error analysis |
| Journal extension | Broader environments, external validation, and deeper theory |

Publication suitability depends on novelty, rigor, ethics, and venue scope—not merely
on having an animated demonstration. Preserve exact configurations and negative results.
