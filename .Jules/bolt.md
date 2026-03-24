# Bolt Performance Journal

## 2025-05-14 - Optimized Team Aggregates Rendering
Learning: Inefficient nested filtering inside React render loops (`map`) causes $O(N^2)$ or $O(N^3)$ complexity as the dataset grows (Teams * Games * Stats). Using `useMemo` to pre-calculate lookup maps for games-by-team and stats-by-game reduces this to $O(N)$ total.
Action: Always check render loops for heavy filtering or repeated utility calls. Use `useMemo` to pre-calculate data structures optimized for $O(1)$ lookup if needed.

## 2025-05-15 - Linearized Stat Aggregation Utilities
Learning: Algorithmic complexity in utility functions (`calculateTeamAggregates`, `initializeStatsMap`) often hidden by simple-looking `.filter()` or `.find()` calls inside loops. Pre-grouping data into Maps/Objects converts $O(N \cdot M)$ complexity into $O(N + M)$, which scales significantly better as the dataset (players, games, stats) grows.
Action: Audit utility functions for nested array methods. Replace nested searching/filtering with Map-based lookups or pre-grouped data structures to ensure linear performance.
