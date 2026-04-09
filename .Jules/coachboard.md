# 🏀 Assistant Coach Board

## Rotations & Lineup Management

### Live Lineup Visibility
- **Unified 5-Slot View**: The scorekeeper MUST see exactly 5 slots for the on-court lineup at all times. FIlling these slots with "Empty" placeholders helps identify when a substitution was missed or when a player was fouled out but not replaced.
- **Interactivity**: Tapping a player in the "Live Lineup" sidebar should immediately trigger the substitution flow. This reduces the number of taps during high-pressure game moments (e.g., when a player is in foul trouble and needs to be pulled immediately).
- **Foul Trouble & Out Indicators**: Explicit " - OUT" labels and distinct color coding for 5+ fouls (red) and 4 fouls (orange) provide immediate coaching utility and prevent illegal substitutions.

## Performance Trends

- **Hot/Cold Streak Indicators**: Players with scoring momentum are identified with emojis (🔥/❄️) and tooltips in the "Live Lineup" and "Player Stats" table.
  - **Hot (🔥)**: Triggered by 3+ consecutive field goal makes.
  - **Cold (❄️)**: Triggered by 3+ consecutive field goal misses.
  - **Workflow**: Helps coaches decide who to keep on the floor and who might need a "reset" on the bench.
