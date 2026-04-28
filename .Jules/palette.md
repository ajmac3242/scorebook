# Palette 🎨 - UX & Accessibility Journal

## 2026-04-28 - Strategic Accessibility Enhancements

### Learning: Semantic Lists for Screen Readers
Using `Stack` (div-based) for tactical notes or lists prevents screen readers from announcing the count of items. Converting to `Box component="ul"` with `Box component="li"` preserves the layout while providing critical structural context.
**Action:** Default to semantic HTML for all instructional or tactical lists.

### Learning: Interactive SVG Accessibility
Interactive SVG elements like the basketball court need both a descriptive `<desc>` for general purpose and `tabIndex={0}`/`role="button"` for individual markers to be truly keyboard-navigable.
**Action:** Always include keyboard navigation hints in SVG descriptions.

### Learning: State Communication in Forms
Standard HTML `required` is often not enough for complex React forms. Adding `aria-required="true"` and `aria-invalid` provides immediate feedback to assistive technology when validation fails.
**Action:** Enforce ARIA validation attributes on all entity creation forms.

### Learning: Real-time Feedback for Async Actions
The "Copy Game ID" feature is a small utility, but providing visual feedback (checkmark icon swap) reduces user uncertainty about whether the action succeeded.
**Action:** Use icon-swapping or toast notifications for all "invisible" clipboard actions.

### Learning: ARIA Live Regions for Tactical Alerts
Momentum alerts (scoring runs, foul trouble) are high-priority but dynamic. Placing them in an `aria-live="polite"` region ensures the coach is notified of game shifts without being interrupted by "assertive" announcements.
**Action:** Use `polite` live regions for all automated tactical insights.
