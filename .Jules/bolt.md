# Bolt Performance Journal

## 2025-05-14 - Optimized Team Aggregates Rendering
Learning: Inefficient nested filtering inside React render loops (`map`) causes $O(N^2)$ or $O(N^3)$ complexity as the dataset grows (Teams * Games * Stats). Using `useMemo` to pre-calculate lookup maps for games-by-team and stats-by-game reduces this to $O(N)$ total.
Action: Always check render loops for heavy filtering or repeated utility calls. Use `useMemo` to pre-calculate data structures optimized for $O(1)$ lookup if needed.

## 2025-05-15 - Linearized Stat Aggregation Utilities
Learning: Algorithmic complexity in utility functions (`calculateTeamAggregates`, `initializeStatsMap`) often hidden by simple-looking `.filter()` or `.find()` calls inside loops. Pre-grouping data into Maps/Objects converts $O(N \cdot M)$ complexity into $O(N + M)$, which scales significantly better as the dataset (players, games, stats) grows.
Action: Audit utility functions for nested array methods. Replace nested searching/filtering with Map-based lookups or pre-grouped data structures to ensure linear performance.

## 2026-03-25 - Efficient Data Sanitization and Redaction
Learning: Deep cloning large objects (like Lambda events) just for redacting a few keys is extremely expensive. Shallow cloning the root and specifically the targeted child objects (like `headers`) provides the same safety at a fraction of the cost. Additionally, replaces declarative pipelines (`Object.entries().filter().map().fromEntries()`) with simple loops in recursion significantly reduces intermediate memory allocations and GC pressure.
Action: Prefer targeted shallow clones over deep clones for redaction. Use simple loops for performance-critical data sanitization to minimize memory overhead.

## 2026-03-25 - Lexicographical Sorting and Memoization
Learning: Converting ISO timestamp strings to `Date` objects repeatedly during a sort operation adds unnecessary overhead, as ISO strings are lexicographically sortable. Also, redundant calculations in render loops (like color luminance) should be memoized at the module level or with `useMemo` to keep frames smooth.
Action: Use direct string comparison for ISO dates in sort functions. Memoize expensive UI logic (color parsing, heavy math) to prevent redundant work on every render.

## 2026-03-25 - High-Impact Frontend and Backend Performance Pass
Learning: Redundant data transformations and inefficient search patterns (e.g., (N)$ lookups inside loops) significantly degrade performance as datasets grow. Using Dexie's `.count()` avoids memory overhead for simple tallies. Memoizing derived state in React prevents expensive recalculations on every frame. On the backend, replacing declarative pipelines with simple `for...in` loops reduces memory allocations and improves response serialization speed. Direct string comparison for ISO timestamps avoids the cost of `Date` object instantiation during sorts.
Action:
- Use `db.table.count()` for record counts.
- Wrap complex reductions and filters in `useMemo`.
- Replace `.find()` or `.some()` in loops with `Map` or `Set` lookups for (1)$ performance.
- Normalize search terms once outside filter loops.
- Use `for...in` loops for performance-critical object sanitization.
- Sort ISO strings directly without converting to `Date`.
