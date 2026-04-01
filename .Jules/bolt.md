## 2025-05-15 - Performance Optimization Sprint

Learning: Decoupling statistical aggregation from UI sorting logic in React `useMemo` hooks (e.g., in `TeamStats.tsx` and `GameStats.tsx`) prevents redundant O(S) calculations when only the sort configuration changes. This significantly improves UI responsiveness for large datasets.
Action: Always separate data transformation/aggregation from sorting or filtering into distinct `useMemo` hooks.

Learning: In performance-critical paths (e.g., `stats.ts` calculations, `GameMode.tsx` live tracking), standard `for` loops are faster than `forEach`, `map`, or `reduce` due to lower function call overhead and fewer intermediate array allocations.
Action: Prioritize `for` loops in utility functions that process large streams of events or run frequently during live tracking.

Learning: Using `Math.round(val * 10) / 10` instead of `toFixed(1)` for rounding to one decimal place avoids string conversion overhead, which adds up in high-frequency calculation paths.
Action: Use numeric rounding operations for performance-sensitive math utilities.

Learning: Extracting stable sub-computations (like a `jerseyMap`) into their own `useMemo` hooks prevents them from being re-created when other dependencies of a larger `useMemo` change, reducing memory churn.
Action: Break down complex `useMemo` hooks into smaller, more granular hooks based on dependency stability.

2026-04-01 - [Consolidated derivations in GameMode]
Learning: Consolidating multiple `useMemo`, `useState`, and `useEffect` hooks that iterate over the same data (e.g., `gameStats`) into a single-pass `useMemo` significantly reduces CPU overhead and prevents unnecessary re-render cycles in high-frequency UI paths.
Action: Identify 'hot path' components with multiple redundant data traversals and consolidate them into a single, efficient loop.
