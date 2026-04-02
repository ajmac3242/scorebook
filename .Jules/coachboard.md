# Assistant Coach Findings & Observations

## Substitution Workflow
- **Current State:** Substitution requires clicking the "Quick Sub" button, then selecting an outgoing player (or empty slot), then an incoming player, then "Sub In".
- **Friction:** 4 taps minimum. Requires moving attention from the lineup list to the dialog.
- **Missing Info:** The substitution dialog doesn't show player stats (fouls, points), which are critical for making rotation decisions.
- **Opportunity:** Tapping a player directly in the "Live Lineup" sidebar should trigger the substitution flow for that player.

## Scorekeeping Speed
- **Current State:** Most actions require 4-5 taps (Location -> Player -> Action -> [Points] -> Save).
- **Observation:** The "Save" button adds an extra tap for every single event.
- **Improvement Idea:** Non-scoring actions (Rebound, Steal, Foul, etc.) could auto-save once a player is selected, or once the action is selected if a player is already active.

## Game Awareness
- **Bonus Status:** Well-implemented with color coding.
- **Foul Trouble:** Highlighted in the stats table, but not visible in the action recording or substitution dialogs.
- **Timeouts:** Tracked but TOL doesn't change color when low (e.g., 1 or 0).

## Lineup Management
- **Empty Slots:** The system allows tracking fewer than 5 players, which is good for flexibility but might lead to accidental omissions.
- **Consistency:** The "Quick Sub" dialog and the "Live Lineup" sidebar should feel like part of the same system.
