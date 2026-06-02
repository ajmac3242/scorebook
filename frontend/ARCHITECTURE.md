# Frontend Architecture

This document describes the architectural principles and organization of the CourtSight frontend.

## Hook Placement Rules

- **Data access hooks** (`src/hooks/`): Wrappers for `useLiveQuery` or other data fetching logic used by two or more pages.
- **Infrastructure hooks** (`src/hooks/`): Hooks for browser APIs, cross-cutting utilities, or global state.
- **Page-scoped hooks** (`src/pages/[Page]/hooks/`): State management, data aggregation, or actions specific to a single page.

## Component Sub-folder Rules

Components are organized by their purpose and reuse scope. If a component is used by only one page, it belongs in `src/pages/[Page]/`. If used by two or more pages, it belongs in `src/components/[sub-folder]/`.

- `layout/` — Page shells, section wrappers, breadcrumbs, and layout containers.
- `cards/` — Entity cards, stat cards, row cards, and `SurfaceCard`.
- `data-display/` — Tables, KPI stats, animated numbers, and sortable headers.
- `feedback/` — Empty states, skeleton loaders, and error boundaries.
- `forms/` — Reusable form primitives and inputs.
- `game/` — Basketball-domain components shared across game-related pages.
- `dialogs/` — Dialogs and modals used by more than one page.
- `navigation/` — Navigation bars and primitives.

When promoting a component from a page folder to `src/components/`, update all import paths and add it to the sub-folder's `index.ts` barrel.

## Theme Entry Point

The application uses a semantic token-based theme system. Always import from `src/theme/` — never from a root-level `theme.ts`.

- `buildTheme()` — Generates the MUI `Theme` object for `ThemeProvider`.
- `tokens` — Contains raw design token values (palette, spacing, etc.).
- `useTokens()` — React hook for consuming semantic tokens inside components.

## SharedUI Migration Status

`SharedUI.tsx` is being deprecated in favor of more specialized primitives:

- `SurfaceCard` — Promoted to `src/components/cards/SurfaceCard.tsx`.
- `AnimatedNumber` — Promoted to `src/components/data-display/AnimatedNumber.tsx`.
- `PageHeader` — **Deprecated**. Use `AppPageShell` and `PageBreadcrumb` instead.
- `StatItem` — **Deprecated**. Use `KpiStat` in `components/data-display/` instead.
- `StatCard` — **Deprecated**. Use `KpiStat` in `components/data-display/` instead.

## Adding New Shared Components

If a component is intended to be used by more than one page, it belongs in the appropriate sub-folder under `src/components/`. When adding a new shared component, ensure it is exported from its sub-folder's `index.ts` barrel file and the master `src/components/index.ts` barrel file.
