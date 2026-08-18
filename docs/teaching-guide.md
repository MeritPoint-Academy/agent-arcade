# Teaching Guide · 教学指南

Agent Arcade can be used as a 15-minute demonstration, a 45-minute lab, or the
opening project in a multi-session AI research course.

## Learning goals

By the end, students should be able to:

- describe imitation learning as supervised learning from demonstrations;
- distinguish a state, action label, reward, policy, and evaluation metric;
- explain weighted k-nearest neighbors in plain language;
- identify one controlled variable and one possible confounder;
- separate an observed result from a causal explanation; and
- propose a measurable extension.

## 15-minute demonstration

| Time | Activity | Instructor question |
|---:|---|---|
| 0–3 min | Play one round | What information would an automated driver need? |
| 3–6 min | Inspect four sensors and exported rows | Which column is the label? |
| 6–9 min | Train and hand over control | What evidence supports the chosen action? |
| 9–13 min | Run the fixed-budget test | What changed, and what stayed fixed? |
| 13–15 min | Write a bounded claim | What can this one experiment not establish? |

## 45-minute lab

1. **Hook — 5 minutes.** Frame the game as a simplified navigation problem: an
   agent observes its environment, chooses an action, and changes the next state.
2. **Human demonstrations — 8 minutes.** Students play until they have at least
   80 examples. Encourage LEFT and RIGHT moves as well as STAY.
3. **Problem transformation — 7 minutes.** Read one CSV row as four input features,
   one human action label, and one subsequent reward.
4. **Coding-level explanation — 8 minutes.** Open `src/policy.js`. Trace distance,
   nearest neighbors, weighted votes, probabilities, and returned action.
5. **Agent takeover — 5 minutes.** Students identify a success and a failure and
   classify the failure as missing data, insufficient sensors, model limitation,
   or a difficult state.
6. **Controlled experiment — 8 minutes.** Predict first, run the one-seed versus
   twelve-seed comparison, and record both results.
7. **Evidence sentence — 4 minutes.** State scope, observed difference, limitation,
   and next experiment.

## Line-by-line policy prompts

Open [`src/policy.js`](../src/policy.js) and ask:

1. What is the input to `squaredDistance`?
2. Why are differences squared before they are added?
3. What does sorting by distance accomplish?
4. Why keep only `k` neighbors?
5. Why does the vote divide by distance?
6. What prevents division by zero?
7. Where is the action selected?
8. If all examples say STAY, is the syntax wrong or is data coverage missing?

## Bounded claim template

> In this three-lane environment, the agent trained on [condition] achieved [A]%
> versus [B]% unseen-level action accuracy with 240 rows in each condition. Because
> we tested one simulated environment and one policy family, the result is preliminary.
> Next, we would [controlled extension].

## Differentiation

- **New coders:** change colors, speed, `k`, or the number of lives and predict the effect.
- **Intermediate coders:** add one sensor and update both the vector and tests.
- **Advanced students:** implement a second policy with the same `predict(input)` API.
- **Research-focused students:** repeat over multiple training budgets and report a
  learning curve with uncertainty rather than one point estimate.

## Safety and privacy

The classroom name may reference the excitement of watching AI take over, but formal
communication should call it an **automated game-playing agent**. It is an original
sandbox and must not be connected to a commercial game or used to evade access controls.
Student CSV exports should remain on student devices unless informed consent and an
approved data-handling plan are in place.
