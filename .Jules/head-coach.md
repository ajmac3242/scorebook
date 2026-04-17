## 2025-05-15 - Strategic Assessment: From Scorekeeper to Head Coach

Observation: The current application provides a robust foundation for recording live basketball events, with a well-designed court-based entry system and immediate statistical feedback. However, it currently functions more as a "digital scorebook" than a "coaching tool." Critical gaps include the lack of a live game clock, which prevents accurate tracking of player minutes and rotation efficiency, and a lack of advanced impact metrics like Plus/Minus (+/-) and Effective Field Goal Percentage (eFG%).

Impact: Without a game clock, coaches cannot monitor player fatigue or objectively evaluate rotation timing. Without advanced metrics, coaching decisions are based on raw totals rather than efficiency and impact, potentially leading to sub-optimal lineup choices. The inability to export data limits the utility of the app for post-game analysis and communication.

Recommendation: Prioritize the implementation of a synchronized game clock to enable minutes tracking, followed by the integration of advanced analytics (+/-, eFG%, TS%) into the box score and player profiles. Finally, introduce automated PDF box score generation to facilitate sharing and long-term record keeping.

## 2025-05-16 - Strategic Shift: From Game Recording to Real-Time Tactical Support

Observation: The foundation of the "digital scorebook" is now solidified with a working game clock, advanced box score metrics (+/-, eFG%), and lineup efficiency tracking. However, the current workflow still burdens the coach with manually synthesizing this data during the heat of the game. We are capturing the data, but we aren't yet using it to drive proactive coaching decisions.

Impact: Without real-time tactical alerts, coaches may miss critical rotation windows (e.g., a player reaching a fatigue threshold) or strategic vulnerabilities (e.g., an un-scouted opponent player dominating the game). The manual entry of free throws also remains a bottleneck that risks data desynchronization during high-foul periods.

Recommendation: Shift focus toward proactive tactical support. This includes implementing real-time fatigue monitoring (stint timers), proactive foul trouble alerts, and an optimized free-throw entry mode. Additionally, the app must evolve to track specific opponent players to allow for real-time defensive adjustments and scouting-grade post-game analysis.

## 2025-05-17 - Precision Coaching: Reliability and Defensive Identity

Observation: As we transition into high-level analytics, the "Butterfly Effect" of human error becomes our greatest risk. A single missed substitution or an incorrectly attributed foul cascades through Plus/Minus, Lineup Efficiency, and Foul Strategy metrics, rendering them untrustworthy. Furthermore, while our offensive tracking is granular, our defensive tracking is still passive—only recording what we "let happen" rather than what we "forced to happen."

Impact: Inaccurate substitution data leads to coaches making rotation decisions based on false fatigue or efficiency data. Lack of active defensive metrics (like "Stops" or "Kills") prevents coaches from motivating their team or identifying defensive momentum during critical game runs.

Recommendation: Implement a "Substitution Timeline Audit" to allow for rapid retroactive corrections of the on-court lineup. Simultaneously, elevate the defensive experience by introducing a "Stops & Kills" tracker in the live scoreboard. Finally, move towards "Verified Periods" where scorekeepers must reconcile their data with the official table at every break, ensuring the data engine remains a source of truth.

## 2025-05-18 - Tactical Depth: Set Analytics and Scouting Continuity

Observation: We have mastered the "What" (stats) and the "Who" (players), but we are still missing the "How" (tactics). Coaches need to know not just that a shot was made, but if it came from a specific set play or offensive concept. Furthermore, our opponent tracking is currently ephemeral—jersey numbers discovered in one game don't persist to the next, forcing scorekeepers to re-identify the same players in a multi-game tournament setting.

Impact: Without play-type tracking, coaches can't objectively evaluate their playbook's effectiveness in real-time. Without scouting continuity, the app loses value in scout-heavy environments where historical data on opponent tendencies is as valuable as live game tracking.

Recommendation: Introduce "Set Play Tagging" to allow coaches to measure the success rate of specific offensive actions. Enable "Persistent Opponent Rosters" to build a scouting database over time. Finally, implement a "Timeline Audit" to ensure that the bedrock of our analytics—the substitution log—can be corrected retroactively without destroying data integrity.

## 2025-05-19 - Tactical Intelligence: Data for Decision Support

Observation: The application has successfully evolved from a simple data capture tool to a robust statistical engine. However, the next frontier is "Tactical Intelligence"—turning that data into immediate, actionable insights for the head coach. Current workflows for recording high-volume events like free throws are still too manual, and post-game reporting requires external effort to share.

Impact: Scorekeepers remain a bottleneck during peak game intensity (e.g., late-game foul situations), leading to potential data loss or lag. Furthermore, the value of the collected data is trapped within the app if it cannot be easily exported as a professional box score or analyzed across a full season to identify long-term player tendencies and tactical "hot zones."

Recommendation: Prioritize "Workflow Speed" (Dedicated Free Throw Mode) and "External Utility" (PDF Export). Following this, move towards "Season-Wide Analytics" to allow coaches to see the bigger picture of their team's performance beyond individual game results.

## 2025-05-20 - Tactical Presence: Bringing the "Engine" to the Scoreboard

Observation: We have built a high-performance statistical engine (`stats.ts`) that can calculate advanced metrics like "Stops," "Kills," and "Lineup Efficiency" in real-time. However, this intelligence is currently "locked in the basement"—it's available in the code, but it's not present on the live scoreboard where the coach actually makes decisions. We are tracking defensive momentum (Stops/Kills) and rotation impact (+/-) but only showing it in post-game summaries.

Impact: Without live tactical visuals, the coach is still relying on "gut feel" for momentum and rotation quality. The app is a record-keeper, not a co-pilot. If we don't visualize the defensive "Kill" streak or the current lineup's +/- in real-time, we are leaving the coach blind to the most critical game-flow indicators that the data is already calculating.

Recommendation: Transition from "Passive Record-Keeping" to "Active Tactical HUD." Integrate the existing "Stops & Kills" logic into a live momentum bar on the scoreboard. Promote "Lineup +/-" to a primary real-time dashboard so the coach can see *exactly* how the current 5-man unit is performing relative to the opponent. Finally, evolve rotation management from simple timers to proactive "Alerts" that trigger before a player reaches their red-line fatigue or foul limit.
