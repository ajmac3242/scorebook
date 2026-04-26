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

## 2026-04-07 - Sorting Optimization with Direct Comparison
Learning: Replacing `localeCompare` with direct relational operators (`<`, `>`) for string and ISO timestamp sorting in hot paths (UI sorting and data aggregation) provides a measurable performance boost. `localeCompare` is significantly more expensive due to locale-sensitive logic which is unnecessary for many standard data types.
Action: Use direct comparison operators for sorting ISO timestamps and simple strings in frequently executed `useMemo` hooks and data processing utilities.

## 2026-04-08 - Fixed-buffer streaks and Centralized Sorting
Learning: Tracking streaks or rolling metrics using a fixed-size buffer (e.g., keeping only the last 3 items) instead of growing arrays for each entity significantly reduces memory churn and GC pressure. Centralizing data sorting into a single `useMemo` and passing an `isSorted` hint to downstream utilities eliminates redundant O(N log N) operations across the derivation pipeline.
Action: Use rolling buffers for streak-like logic and centralize expensive data preparation (like sorting) when used by multiple consumers.

## 2026-04-09 - Global Totals and Hot-path Cache Optimization
Learning: Refactoring roster-wide aggregate calculations (like `calculateOnOffStats`) to track global team totals and individual "ON" stats allows deriving "OFF" metrics via subtraction. This reduces algorithmic complexity from O(Events * RosterSize) to O(Events + RosterSize), providing massive scalability gains for long seasons.
Action: Use global-sum-minus-active-sum derivation to calculate "Off" or "Rest of Team" metrics in O(N) instead of O(N*P).

Learning: Caching the array representation of dynamic collections (e.g., `Array.from(lineupSet)`) and only refreshing it when the collection changes prevents thousands of redundant allocations in high-frequency event loops like `calculateScoreFlow`.
Action: Never call `Array.from()` or `Object.keys()` inside a tight loop if the collection has not changed since the last iteration.

## 2026-04-10 - Performance Optimization Deep Dive
Learning: Squaring numbers using `a * a` is significantly more efficient than `Math.pow(a, 2)` in high-frequency geometric calculations (like court zone mapping). While `Math.pow` is more general, direct multiplication avoids function call overhead for a very common operation.
Action: Use direct multiplication `x * x` for squaring in hot paths.

Learning: Tracking 'boundary events' (like the last scoring event) during a single-pass traversal allows for O(1) interval recording, transforming algorithms like `calculateScoringRuns` from O(N^2) to O(N). This avoids expensive look-back operations like `.slice().reverse().find()`.
Action: Use variables to track state from the previous iteration to eliminate redundant searches in the stream.

Learning: Stint-based aggregation (e.g., Lineup stats) can be optimized via 'batching'. By accumulating duration and points in "pending" variables and only flushing to the result Map on lineup changes, we avoid thousands of expensive Map lookups and key generations.
Action: Implement a 'dirty-flush' pattern for interval-based metrics to minimize Map operations.

Learning: Manual single-pass character loops are more efficient than functional chains (`split().map().join()`) for simple string transformations like `getInitials`. This avoids multiple intermediate array allocations and regex overhead.
Action: Use low-level string iteration for simple extraction logic in performance-critical paths.

Learning: Standardizing on a single `Map.get()` call followed by a null check, instead of the `Map.has()` followed by `Map.get()` pattern, halves the number of hash-table lookups.
Action: Always use the single-lookup `get` pattern for Map access in loops.
