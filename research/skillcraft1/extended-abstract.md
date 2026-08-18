# How Much Telemetry Is Enough?

**45-word takeaway.** Four interpretable gameplay sensors retained most of the
discrimination achieved by all fifteen telemetry variables. Across identical
five-fold splits, ROC AUC rose from 0.861 to 0.879 with the larger sensor set—a
modest 0.018 gain that motivates controlled sensor ablation rather than a causal claim.

## Background

Game telemetry turns play into sequences of measurable actions, creating opportunities
for player modeling and adaptive game systems. For a classroom agent project, however,
using every available signal can make the model harder to explain. We asked how much
predictive performance is lost when a classifier for higher-ranked StarCraft II players
uses four interpretable behavioral sensors rather than all fifteen telemetry variables
in an open dataset. The study bridges a browser-game activity, where an agent sees four
numeric sensors, and a reproducible analysis of real gameplay records.

## Method

We used the SkillCraft1 Master Table Dataset from the UCI Machine Learning Repository
(CC BY 4.0), containing 3,395 player records. We operationalized “high skill” as
LeagueIndex 5–8 (Diamond through Professional; n = 1,517) and the comparison class as
LeagueIndex 1–4 (n = 1,878). The four-sensor model used actions per minute, selection by
hotkeys, action latency, and number of perception–action cycles. The full model used all
fifteen available behavioral telemetry features. Each condition used z-scored inputs
and the same class-balanced logistic-regression specification. We evaluated both
conditions with identical five-fold stratified cross-validation splits, shuffled with
`random_state = 42`. Accuracy, balanced accuracy, and ROC AUC were calculated for every
held-out fold; reported spreads are standard deviations across those five folds.

## Results

The four-sensor model achieved accuracy 0.776 ± 0.013, balanced accuracy 0.776 ± 0.013,
and ROC AUC 0.861 ± 0.011. The fifteen-sensor model achieved accuracy 0.789 ± 0.012,
balanced accuracy 0.789 ± 0.010, and ROC AUC 0.879 ± 0.012. Thus, adding eleven telemetry
variables was associated with a 0.018 increase in mean ROC AUC and a 0.012 increase in
mean accuracy. The compact sensor set retained most of the full model’s discrimination
on these folds, while the larger set produced a modest improvement. The result does not
establish that any sensor causes a player to become more skilled.

## Limitations

LeagueIndex is an operational label based on competitive rank, not a complete definition
of expertise. This analysis uses one historical game dataset and one linear classifier;
it does not test other games, time periods, model families, or prospective players.
Repeated records, unmeasured context, and telemetry construction could affect estimates.
Cross-validation reduces dependence on one train/test split but does not provide external
validation. Metric differences are descriptive; no inferential test or confidence interval
was specified in the evidence receipt.

## Next Experiment

Run a preregistered sensor-ablation ladder with the same five folds: begin with actions
per minute alone, then add selection by hotkeys, action latency, and number of
perception–action cycles one at a time, followed by the remaining sensors in documented
groups. Record fold-level ROC AUC, balanced accuracy, calibration, and inference time at
every step. This controlled sequence would show which additions provide stable incremental
value and whether the four-sensor model offers a useful accuracy–interpretability tradeoff.

> **Disclosure:** AI assisted with wording; the authors supplied and checked every number
> against the saved evidence receipt.
