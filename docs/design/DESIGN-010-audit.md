# DESIGN-010-A: Design Audit — Layout & Navigation Files

**Audit Date:** 2025 (auto-generated)
**Depends on:** DESIGN-005-C (pending — search results data wiring)
**Scope:** `src/components/layout/` and `src/components/search/`

---

## Summary

This audit documents the theme-compliance status of all layout and search component files added during the DESIGN-003 through DESIGN-005 stories. Findings are categorised as Pass, Warning, or Needs Fix.

---

## Components Audited

### `src/components/layout/AppShell.tsx` (DESIGN-003-A)
| Check | Result | Notes |
|---|---|---|
| No hardcoded hex colours | ✅ Pass | Uses MUI `sx` tokens only |
| Uses MUI spacing scale | ✅ Pass | All padding via `theme.spacing` |
| Responsive breakpoints | ✅ Pass | Drawer width set per breakpoint |

### `src/components/layout/SideNav.tsx` (DESIGN-003-B)
| Check | Result | Notes |
|---|---|---|
| No hardcoded hex colours | ✅ Pass | Active item uses `primary.main` token |
| Uses MUI spacing scale | ✅ Pass | |
| Icon + label alignment | ✅ Pass | |

### `src/components/layout/BottomNav.tsx` (DESIGN-003-C)
| Check | Result | Notes |
|---|---|---|
| No hardcoded hex colours | ✅ Pass | |
| Mobile-only via `display: { sm: 'none' }` | ✅ Pass | |
| Animated live indicator | ✅ Pass | Uses keyframes, no hex |

### `src/components/layout/AppTopBar.tsx` (DESIGN-004)
| Check | Result | Notes |
|---|---|---|
| No hardcoded hex colours | ✅ Pass | `bgcolor: 'background.paper'` |
| Height tokens 56px / 64px | ✅ Pass | Correct breakpoint values |
| `CourtSightLogo` used | ✅ Pass | |

### `src/components/layout/SyncBadge.tsx` (DESIGN-004)
| Check | Result | Notes |
|---|---|---|
| Hardcoded hex colours | ⚠️ Warning | `#22c55e` and `#9ca3af` used for live/offline colours. Acceptable as semantic colours not in MUI palette, but should be extracted to tokens in a follow-up |

### `src/components/search/OmniSearch.tsx` (DESIGN-005-A)
| Check | Result | Notes |
|---|---|---|
| No hardcoded hex colours | ✅ Pass | All MUI tokens |
| Mobile full-screen / tablet inline | ✅ Pass | |
| Section headers correct | ✅ Pass | Players, Games, Teams, Reports, Actions |
| Keyboard navigation | ⚠️ Warning | Shell only — full keyboard nav deferred to DESIGN-005-C |

---

## Action Items

| ID | File | Issue | Priority |
|---|---|---|---|
| A1 | `SyncBadge.tsx` | Extract `#22c55e` / `#9ca3af` to theme tokens | Low |
| A2 | `OmniSearch.tsx` | Wire keyboard navigation after DESIGN-005-C | Medium |

---

## Sign-off

All critical theme compliance checks pass. Two low/medium warnings logged above for follow-up in DESIGN-005-C and a future token cleanup story.
