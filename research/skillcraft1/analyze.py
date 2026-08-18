#!/usr/bin/env python3
"""Reproduce the SkillCraft1 open-data extension for Agent Arcade.

The script downloads the CC BY 4.0 dataset from UCI, verifies its checksum,
compares four and fifteen telemetry features under identical cross-validation
folds, and writes only aggregate results and a chart.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


ROOT = Path(__file__).resolve().parent
URL = "https://archive.ics.uci.edu/static/public/272/skillcraft1+master+table+dataset.zip"
DOI = "https://doi.org/10.24432/C5161N"
EXPECTED_SHA256 = "d6f4f88c2d077a0938cf774ff242df511c9a5801dcc66e4461ffdf893ce23fc2"

FOUR_SENSORS = ["APM", "SelectByHotkeys", "ActionLatency", "NumberOfPACs"]
ALL_SENSORS = [
    "APM",
    "SelectByHotkeys",
    "AssignToHotkeys",
    "UniqueHotkeys",
    "MinimapAttacks",
    "MinimapRightClicks",
    "NumberOfPACs",
    "GapBetweenPACs",
    "ActionLatency",
    "ActionsInPAC",
    "TotalMapExplored",
    "WorkersMade",
    "UniqueUnitsMade",
    "ComplexUnitsMade",
    "ComplexAbilitiesUsed",
]


def download() -> tuple[pd.DataFrame, str]:
    request = urllib.request.Request(URL, headers={"User-Agent": "Agent-Arcade/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = response.read()

    sha256 = hashlib.sha256(payload).hexdigest()
    if sha256 != EXPECTED_SHA256:
        raise RuntimeError(
            "The downloaded dataset archive changed. "
            f"Expected {EXPECTED_SHA256}; received {sha256}. Review before continuing."
        )

    with tempfile.TemporaryDirectory() as temporary_directory:
        archive = Path(temporary_directory) / "skillcraft.zip"
        archive.write_bytes(payload)
        with zipfile.ZipFile(archive) as bundle:
            csv_bytes = bundle.read("SkillCraft1_Dataset.csv")
    return pd.read_csv(io.BytesIO(csv_bytes), na_values="?"), sha256


def evaluate(df: pd.DataFrame, features: list[str], cv: StratifiedKFold) -> dict:
    target = (df["LeagueIndex"] >= 5).astype(int)
    model = Pipeline(
        [
            ("scale", StandardScaler()),
            (
                "model",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )
    scored = cross_validate(
        model,
        df[features],
        target,
        cv=cv,
        scoring=["accuracy", "balanced_accuracy", "roc_auc"],
    )

    folds = []
    for index in range(cv.n_splits):
        folds.append(
            {
                "fold": index + 1,
                "accuracy": round(float(scored["test_accuracy"][index]), 6),
                "balanced_accuracy": round(float(scored["test_balanced_accuracy"][index]), 6),
                "roc_auc": round(float(scored["test_roc_auc"][index]), 6),
            }
        )

    summary = {}
    for metric in ("accuracy", "balanced_accuracy", "roc_auc"):
        values = np.asarray(scored[f"test_{metric}"])
        summary[metric] = {
            "mean": round(float(values.mean()), 6),
            "sd": round(float(values.std(ddof=1)), 6),
        }
    return {"features": features, "folds": folds, "summary": summary}


def make_chart(results: dict, output_directory: Path) -> None:
    labels = ["4-sensor\nbaseline", "15-sensor\nextension"]
    keys = ["four_sensor", "fifteen_sensor"]
    means = [results["models"][key]["summary"]["roc_auc"]["mean"] for key in keys]
    errors = [results["models"][key]["summary"]["roc_auc"]["sd"] for key in keys]

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 16})
    figure, axis = plt.subplots(figsize=(12, 6.75), dpi=150)
    figure.patch.set_facecolor("#071426")
    axis.set_facecolor("#0c2640")
    bars = axis.bar(
        labels,
        means,
        yerr=errors,
        capsize=8,
        width=0.54,
        color=["#53edf4", "#ffc857"],
        edgecolor="#effbff",
        linewidth=1.5,
    )
    axis.set_ylim(0.78, 0.92)
    axis.set_ylabel("5-fold ROC AUC (mean ± SD)", color="#d9e9f5")
    axis.set_title(
        "More telemetry helped modestly — under the same five folds",
        color="#f5fbff",
        fontsize=22,
        weight="bold",
        pad=20,
    )
    axis.grid(axis="y", color="#33536c", alpha=0.65, linewidth=1)
    axis.tick_params(colors="#d9e9f5")
    for spine in axis.spines.values():
        spine.set_color("#33536c")
    for bar, value, error in zip(bars, means, errors):
        axis.text(
            bar.get_x() + bar.get_width() / 2,
            value + error + 0.006,
            f"{value:.3f} ± {error:.3f}",
            ha="center",
            va="bottom",
            color="#f5fbff",
            weight="bold",
            fontsize=17,
        )
    axis.text(
        0.5,
        0.02,
        "n = 3,395 players · target: LeagueIndex ≥ 5 · logistic regression · random_state = 42",
        transform=axis.transAxes,
        ha="center",
        va="bottom",
        color="#9cb7ca",
        fontsize=12,
    )
    figure.tight_layout()
    figure.savefig(output_directory / "sensor-budget.png", bbox_inches="tight", facecolor=figure.get_facecolor())
    plt.close(figure)


def write_outputs(results: dict, output_directory: Path) -> None:
    output_directory.mkdir(parents=True, exist_ok=True)
    (output_directory / "results.json").write_text(
        json.dumps(results, indent=2) + "\n",
        encoding="utf-8",
    )
    with (output_directory / "fold-results.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["model", "fold", "accuracy", "balanced_accuracy", "roc_auc"],
            lineterminator="\n",
        )
        writer.writeheader()
        for model_name, model_result in results["models"].items():
            for fold in model_result["folds"]:
                writer.writerow({"model": model_name, **fold})
    make_chart(results, output_directory)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "output",
        help="Directory for aggregate outputs (default: ./output)",
    )
    arguments = parser.parse_args()

    dataframe, sha256 = download()
    if len(dataframe) != 3395:
        raise RuntimeError(f"Expected 3,395 SkillCraft rows; received {len(dataframe):,}")
    if dataframe[ALL_SENSORS].isna().any().any():
        raise RuntimeError("Selected telemetry features unexpectedly contain missing values")

    cross_validation = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    models = {
        "four_sensor": evaluate(dataframe, FOUR_SENSORS, cross_validation),
        "fifteen_sensor": evaluate(dataframe, ALL_SENSORS, cross_validation),
    }
    target = (dataframe["LeagueIndex"] >= 5).astype(int)
    results = {
        "source": {
            "name": "SkillCraft1 Master Table Dataset",
            "creators": "Blair, Thompson, Henrey, and Chen (2013)",
            "url": URL,
            "doi": DOI,
            "license": "CC BY 4.0",
            "download_sha256": sha256,
        },
        "research_question": (
            "How much predictive performance is lost when a high-skill player classifier "
            "uses four interpretable telemetry sensors instead of all 15 available sensors?"
        ),
        "target": "LeagueIndex >= 5 (Diamond through Professional)",
        "n_rows": int(len(dataframe)),
        "class_counts": {
            "lower_skill_1_to_4": int((target == 0).sum()),
            "high_skill_5_to_8": int((target == 1).sum()),
        },
        "method": (
            "Class-balanced logistic regression with z-scored features; five-fold stratified "
            "cross-validation with shuffle=True and random_state=42."
        ),
        "models": models,
    }
    four_auc = models["four_sensor"]["summary"]["roc_auc"]["mean"]
    full_auc = models["fifteen_sensor"]["summary"]["roc_auc"]["mean"]
    results["observed_delta_roc_auc"] = round(full_auc - four_auc, 6)
    write_outputs(results, arguments.out)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
