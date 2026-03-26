# Palette's Journal

## 2025-05-14 - Standardizing Interactive Feedback
Learning: Users need immediate confirmation after asynchronous creation actions. Without Snackbars or loading states, the UI feels unresponsive. Adding ARIA labels to icon buttons is a low-effort, high-impact a11y win.
Action: Always implement `isSubmitting` states and Success Snackbars for any form-based entity creation. Ensure all icon buttons have `aria-label` and `Tooltip`.

## 2025-05-14 - Empty State Guidance
Learning: Plain text empty states are easily missed and don't guide the user. Visual cues like dashed borders and large icons make the "next step" clearer.
Action: Use a standardized `Box` with dashed borders for empty list states.

## 2025-05-14 - Keyboard Support parity
Learning: Power users expect 'Enter' to submit forms. Adding `onKeyDown` to text fields improves the flow significantly.
Action: Add Enter-key support to all creation dialogs.
