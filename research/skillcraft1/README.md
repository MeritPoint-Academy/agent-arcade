# SkillCraft1 open-data extension

This reproducible example connects Agent Arcade's four-sensor teaching model with
real game-telemetry research. It asks:

> How much predictive performance is lost when a high-skill player classifier uses
> four interpretable telemetry features instead of all fifteen available features?

## Data

Blair, Thompson, Henrey, and Chen (2013),
[SkillCraft1 Master Table Dataset](https://doi.org/10.24432/C5161N), UCI Machine
Learning Repository, CC BY 4.0.

The analysis downloads the dataset at run time, verifies the ZIP SHA-256, keeps raw
rows in memory/a temporary directory, and writes only aggregate outputs. No raw
player-level data is committed.

## Reproduce

```bash
cd research/skillcraft1
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python analyze.py
```

Outputs are written to `output/`. Compare them with the checked evidence receipt in
`artifacts/`.

## Evidence-to-writing demo

`prompt-used.txt` shows how the saved numerical receipt was given to a language model.
The prompt constrains causal language, prevents invented statistics, preserves
mean ± SD, requires limitations, and requests a realistic next experiment.

Generative AI did not compute the results. The Python analysis produced the numbers;
AI assisted only with wording after the evidence existed.
