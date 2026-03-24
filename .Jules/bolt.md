# Bolt Performance Journal

## 2025-05-14 - Optimized Team Aggregates Rendering
Learning: Inefficient nested filtering inside React render loops (`map`) causes $O(N^2)$ or $O(N^3)$ complexity as the dataset grows (Teams * Games * Stats). Using `useMemo` to pre-calculate lookup maps for games-by-team and stats-by-game reduces this to $O(N)$ total.
Action: Always check render loops for heavy filtering or repeated utility calls. Use `useMemo` to pre-calculate data structures optimized for $O(1)$ lookup if needed.
