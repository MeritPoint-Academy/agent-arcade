/*
 * Weighted k-nearest-neighbors imitation policy.
 * The intentionally small model makes every prediction inspectable.
 */
(function attachPolicy(root) {
  "use strict";

  function squaredDistance(a, b) {
    return a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0);
  }

  function trainKnn(rows, k = 9) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("trainKnn needs at least one demonstration row");
    }
    if (!Number.isInteger(k) || k < 1) throw new Error("k must be a positive integer");

    const counts = { [-1]: 0, [0]: 0, [1]: 0 };
    rows.forEach((row) => { counts[row.action] += 1; });
    const weights = {
      [-1]: rows.length / (3 * Math.max(1, counts[-1])),
      [0]: rows.length / (3 * Math.max(1, counts[0])),
      [1]: rows.length / (3 * Math.max(1, counts[1])),
    };

    return {
      rows,
      k,
      counts,
      predict(input) {
        const near = rows
          .map((row) => ({ action: row.action, distance: squaredDistance(row.x, input) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, Math.min(k, rows.length));

        const vote = { [-1]: 0, [0]: 0, [1]: 0 };
        near.forEach((neighbor) => {
          vote[neighbor.action] += weights[neighbor.action]
            / (0.025 + Math.sqrt(neighbor.distance));
        });

        const sum = vote[-1] + vote[0] + vote[1] || 1;
        const probabilities = {
          [-1]: vote[-1] / sum,
          [0]: vote[0] / sum,
          [1]: vote[1] / sum,
        };
        const action = [-1, 0, 1].sort((a, b) => probabilities[b] - probabilities[a])[0];

        return {
          action,
          probabilities,
          vote,
          neighbors: near,
          nearestDistance: near[0]?.distance ?? 0,
        };
      },
    };
  }

  const api = { squaredDistance, trainKnn };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) Object.assign(root.AgentArcade ||= {}, api);
})(typeof window !== "undefined" ? window : null);
