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

## 2026-04-02 - Frontend Performance Optimization
Learning: Consolidating multiple statistical derivations into a single pass over a sorted event stream significantly reduces array traversals and redundant database queries in hot-path components like GameMode.tsx and GameStats.tsx. Memoizing frequent sub-components and stabilizing event handlers with useCallback prevents unnecessary re-renders during high-pressure live tracking.
Action: Always look for opportunities to merge useMemo loops and move static configuration (like styles or formatters) outside component render paths.

## 2026-04-04 - GameMode Hot-path and Component Optimization
Learning: Refactoring 'recent items' slicing to use `slice(-N).reverse()` instead of `[...arr].reverse().slice(0, N)` avoids an O(N) full array copy and reversal, providing significant efficiency gains as the event stream grows. Using standard `for` loops for Map initialization avoids intermediate array allocations common with `.map()`.
Action: Use `slice(-N)` for tail-extraction from sorted arrays and prefer `for` loops in high-frequency `useMemo` blocks to reduce garbage collection pressure.

Learning: When memoizing complex functional components, omitting the `React.FC` type and instead typing the props directly in the function arguments ensures compatibility with `React.memo` and prevents TypeScript errors related to `MemoExoticComponent` vs `FunctionComponent`.
Action: Prefer direct prop typing over `React.FC` for components intended for memoization.

## 2026-04-05 - Sync Service Optimization
Learning: Batching database operations with `bulkPut()` and parallelizing independent network requests using `Promise.all()` drastically reduces synchronization time and transaction overhead in local-first architectures. Updating global test mocks to include new performance-oriented methods (like `bulkPut`) is essential to prevent 'not a function' regressions in the CI pipeline.
Action: Always use `bulkPut()` for iterative writes in sync paths and parallelize independent asynchronous operations to maximize throughput. Ensure test mocks stay in sync with API changes.

## 2026-04-06 - Advanced Performance Patterns
Learning: Parallelizing independent IndexedDB table checks using `Promise.all()` instead of sequential awaits (as seen in `hasUnsyncedChanges`) reduces total latency by shifting from O(Sum(Latencies)) to O(Max(Latency)).
Action: Always use `Promise.all()` for independent asynchronous data checks.

Learning: In high-frequency data transformation paths (like `calculatePlayerAggregates`), using a `Map` instead of a plain object for dynamic key-value storage and iterating via `statsMap.values()` provides more consistent O(1) performance and avoids the O(N) overhead and intermediate array allocation of `Object.keys()`.
Action: Prioritize `Map` for dynamic aggregations and use direct value iteration where possible.

## 2026-04-08 - Optimized Team Stats Aggregation
Learning: Pre-populating a `Map` with target identifiers before iterating over a large event stream (e.g., in `calculateTeamAggregates`) eliminates the need for redundant `Set` lookups or existence checks (`if (!map.has(id))`) inside the hot path. Iterating over `map.values()` for finalization further reduces overhead compared to `for...in` loops.
Action: Always pre-populate target Maps when the key space is known in advance to maximize throughput in high-frequency loops.
