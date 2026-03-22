# Palette's Journal

## 2025-05-14 - Initial Exploration
**Learning:** The application uses Material UI and has several entities like Seasons, Teams, Players, and Games. It's a mobile-first "Basketball Stats Notebook".
**Action:** Focus on enhancing accessibility and small delight touches across these entities.

## 2025-05-14 - Accessibility & UX Audit
**Learning:** Found a recurring pattern of missing `aria-labelledby` on Dialogs and lack of ARIA labels on icon-only buttons (Back, Stats, Edit, Delete). Also noticed that "Loading..." text without visual indicators feels disconnected on mobile.
**Action:** Always link `DialogTitle` to `Dialog` via ID. Use `CircularProgress` for a more native mobile feel. Added `EmptyState` component to provide clear CTAs when lists are empty.
