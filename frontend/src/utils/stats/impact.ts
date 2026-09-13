/**
 * @file impact.ts
 * @description Facade re-exporting impact statistics, player streaks, on/off differential metrics,
 * and defensive breakdown stats from focused submodules.
 *
 * WHY: Maintains 100% backwards compatibility for existing imports while delegating implementation
 * to modularized submodules under `utils/stats/impact/`.
 */

export * from "./impact/streaks";
export * from "./impact/onOff";
export * from "./impact/defensive";
