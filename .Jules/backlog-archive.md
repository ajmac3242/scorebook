# Scorebook Backlog Archive

## [ ] Live "Game Identity" Radar
**Priority:** HIGH
**Type:** UX
**Why:** Teams often lose their "Identity" (e.g., "We are a fast-break team") during high-pressure games. A radar chart comparing live performance against the "Team Blueprint" keeps the team focused.
**What:** A real-time Radar Chart in GameMode that compares current game Four Factors and Pace against the team's season-long averages (the "Blueprint").
**Acceptance Criteria:**
- [ ] Interactive Radar Chart in the GameMode sidebar.
- [ ] Overlay of "Current Game" (Solid) vs "Season Average" (Dashed) for: Pace, eFG%, TO%, ORB%, and FT Rate.
- [ ] "Identity Alert" when a core metric deviates by more than 20% from the blueprint.
**Status:** [ ] COMPLETE

## [ ] Integrated Practice Prescription Engine
**Priority:** HIGH
**Type:** Feature
**Why:** The best coaches use game data to plan the next practice. This feature closes the loop by suggesting specific drills based on the team's statistical failures in the last game.
**What:** A logic engine that maps low KPI performance (e.g., low FT%, high TOs) to a library of suggested practice drills.
**Acceptance Criteria:**
- [ ] "Practice Planner" button on the Game Stats page.
- [ ] Automatic suggestion of 3 "Focus Areas" based on the game's worst-performing metrics.
- [ ] Linkage to a (mock) library of drills (e.g., "Poor 3PT% -> Suggest '100 Makes' Drill").
**Status:** [ ] COMPLETE

## [ ] Automated Defensive Synergy Analysis (2-3 Player Units)
**Priority:** HIGH
**Type:** Feature
**Why:** Some defensive pairings are greater than the sum of their parts. Coaches need to know which duos/trios anchor the defense most effectively, beyond just 5-man units which can have small sample sizes.
**What:** Build a "Defensive Synergy" report that calculates Opponent PPP and Forced Turnover % for every 2-player and 3-player combination that has played significant minutes together.
**Acceptance Criteria:**
- [ ] New "Synergy" tab in Team Analytics.
- [ ] Table showing 2-player and 3-player units with Defensive Rating (DRtg) and Net Rating.
- [ ] Filter to show only units with > 10 minutes played.
- [ ] Highlight "Shut-Down Units" (units with DRtg significantly better than team average).
**Status:** [ ] COMPLETE

## [ ] Situational "Clutch-Mode" Playbook Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** Games are decided in high-pressure windows. Coaches need data-driven play suggestions that consider the active lineup's efficiency and the opponent's specific defensive vulnerabilities in the final 4 minutes.
**What:** Build an advisor that triggers in "Clutch Mode" (final 4 mins, <5pt spread) and recommends the top 3 offensive plays from the playbook based on current game PPP and defender archetype mismatches.
**Acceptance Criteria:**
- [ ] "Clutch Playbook" overlay in GameMode HUD during clutch situations.
- [ ] Dynamic ranking of playbook sets based on PPP in the current game.
- [ ] Recommendation logic that filters for plays that attack the opponent's "weakest" active defender.
- [ ] Manual toggle to view suggestions at any time.
**Status:** [ ] COMPLETE

## [ ] Official Tendency & Foul Context Tracker
**Priority:** HIGH
**Type:** Feature
**Why:** Officiating significantly impacts game flow. Tracking referee tendencies (e.g., calling 70% of fouls on the away team) allows coaches to adjust team aggressiveness and defensive style in real-time.
**What:** Add an "Officiating" section to the GameMode to track foul distribution and referee "Tightness" (fouls per minute).
**Acceptance Criteria:**
- [ ] "Official Bias" HUD showing Team Foul % vs Opponent Foul % split.
- [ ] "Referee Tightness Meter" comparing live game foul rate against analytical baseline.
- [ ] Post-game summary of "Impact of Officiating" on the final score including Starter/Bench attribution.
**Status:** [ ] COMPLETE

## [ ] Real-Time "Pace & Pressure" Analytics HUD
**Priority:** HIGH
**Type:** UX
**Why:** Losing control of the game's tempo is a primary cause of blown leads. Real-time monitoring of Pace (Possessions per 40m) and Shot-Clock Pressure ensures the team sticks to the "Winning Blueprint."
**What:** Integrate live tempo tracking into the GameMode sidebar, comparing current pace against the target "Identity" pace.
**Acceptance Criteria:**
- [ ] "Pace Meter" showing live possessions-per-40m calculation.
- [ ] Visual indicator of "Tempo Delta" (Difference between our target pace and current game pace).
- [ ] "Pace Shift" notification when the game tempo changes by more than 15% in a single period.
**Status:** [ ] COMPLETE

## [ ] Advanced Post-Game "Film Session" Report
**Priority:** HIGH
**Type:** UX
**Why:** Post-game review is for learning. Grouping stats by tactical context (e.g., "Show me all Contested Misses") helps coaches identify specific execution errors to fix in practice.
**What:** A specialized Game Stats view optimized for film review sessions, grouping events by "Play Name," "Shot Quality," and "Result."
**Acceptance Criteria:**
- [ ] "Film Room View" toggle in Game Stats.
- [ ] Chronological event log with expandable details (Matchup, Play Type).
- [ ] One-tap filtering for "Key Moments" (Bookmarked events).
- [ ] Grouped summary: EFG% by Play Name, PPP by Shot Quality.
**Status:** [ ] COMPLETE

## [ ] Halftime "War Room" Tactical Advisor
**Priority:** HIGH
**Type:** Feature
**Why:** The 10 minutes of halftime are frantic. A "Tactical Advisor" that delivers 3-5 punchy, data-driven bullet points allows the coach to walk into the locker room with immediate answers.
**What:** An automated insight engine in the Halftime Report that identifies the most impactful trends (e.g., "Lineup X is -12", "Opponent #24 scoring 1.8 PPP on drives").
**Acceptance Criteria:**
- [ ] "Coach's Notes" section in the Halftime Report.
- [ ] Automated bullets for: Most effective/ineffective 5-man unit.
- [ ] Automated bullets for: Top 3 opponent threats with "Points Allowed" attribution.
- [ ] Automated bullets for: Primary "Four Factor" deficit (e.g., "We are losing the ORB battle 12% to 35%").
**Status:** [ ] COMPLETE

## [ ] Visual Rotation & Stint Timeline Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Coaches manage the game in "waves." Seeing a visual timeline of when players were on and off the court helps identify fatigue patterns and rotation gaps that raw minute totals hide.
**What:** Create a horizontal Gantt-style timeline chart showing exactly when each player was on the floor throughout the game.
**Acceptance Criteria:**
- [ ] Interactive timeline on the Game Stats page with a row for each player.
- [ ] Color-coded bars showing "On Court" periods.
- [ ] Overlay "Runs" (Team scoring bursts) on the timeline to see which players were present during big momentum shifts.
- [ ] Toggle to show "Personal Fouls" markers on the timeline.
**Status:** [ ] COMPLETE

## [ ] Defensive Assignment & Matchup Tracking
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know who is responsible for opponent scoring. Raw team defensive stats don't tell you which individual player is failing to stop their man.
**What:** Add a "Matchup" layer to the live game tracking. Allow coaches to assign a "Primary Defender" to each active opponent. When an opponent scores, the points are automatically attributed as "Points Allowed" to their defender.
**Acceptance Criteria:**
- [ ] UI in GameMode to "Drag and Drop" our players onto opponent players to set assignments.
- [ ] Tracking of "Points Allowed" per player.
- [ ] "Defensive Stop %" per player (how often an opponent possession ends in a stop while they are the primary defender).
- [ ] Summary in GameStats showing "Matchup Battle" (Our #5 vs Their #10).
**Status:** [ ] COMPLETE

## [ ] On/Off Team Impact Analytics
**Priority:** HIGH
**Type:** Feature
**Why:** Some players have a high +/- because they play with the starters; others make the bench units better. On/Off splits reveal the true impact of a player by comparing team performance when they are on the floor vs. when they are on the bench.
**What:** Calculate team-level metrics (Offensive Rating, Defensive Rating, Net Rating) for both states (Player ON vs. Player OFF) across multiple games.
**Acceptance Criteria:**
- [ ] New "Impact" tab in Player Stats or Team Analytics.
- [ ] Display "Team Net Rating (ON)" vs "Team Net Rating (OFF)" for each player.
- [ ] "Impact Differential" (The difference between ON and OFF metrics).
- [ ] Support for filtering by season or last X games to identify recent trends.
**Status:** [ ] COMPLETE

## [ ] Automated "Next Up" Rotation Suggester
**Priority:** HIGH
**Type:** Feature
**Why:** Managing a 12-player roster under pressure is mentally taxing. An automated suggester helps coaches stick to their rotation plan while accounting for foul trouble and fatigue.
**What:** Build a "Rotation Engine" that suggests which players should be subbed in based on pre-game "Target Minutes" and live fatigue/foul status.
**Acceptance Criteria:**
- [ ] "Rotation Plan" UI in Team Settings to set target minutes and preferred pairings.
- [ ] Live "Suggestion HUD" in GameMode showing "Next Up" players with one-tap substitution.
- [ ] Automatic adjustment of suggestions based on live foul counts (e.g., suggesting a sub for a player with 2 fouls in the 1st quarter).
**Status:** [ ] COMPLETE

## [ ] Live Opponent Tendency Scouting Report
**Priority:** HIGH
**Type:** Feature
**Why:** Opponents often repeat successful patterns (e.g., always driving left, or a specific player only shooting from the corner). Live tendency alerts allow for mid-game defensive adjustments.
**What:** Analyze opponent shot locations and drive directions in real-time to identify "Hot Zones" and "Directional Tendencies."
**Acceptance Criteria:**
- [ ] "Opponent Tendency" card in GameMode sidebar.
- [ ] Visual alerts for patterns (e.g., "Opponent #12: 80% of shots are in the paint").
- [ ] "Shot Type" breakdown for top opponent scorers (Catch-and-shoot vs Off-the-dribble).
**Status:** [ ] COMPLETE

## [ ] Team Wide "Four Factors" Performance HUD
**Priority:** HIGH
**Type:** Feature
**Why:** The "Four Factors" (eFG%, Turnover Rate, Offensive Rebound Rate, Free Throw Rate) are the most reliable predictors of winning. Seeing these in real-time tells a coach *why* they are winning or losing.
**What:** Add a "Four Factors" comparison dashboard to the GameMode and GameStats pages.
**Acceptance Criteria:**
- [ ] Real-time calculation of eFG%, TO%, ORB%, and FTR for both teams.
- [ ] "Success Threshold" indicators (e.g., highlighting in green if eFG% is > 55%).
- [ ] Comparison against season averages to see if the team is over/under performing in key areas.
**Status:** [ ] COMPLETE

## [ ] Defensive Scheme Efficiency Tracking (Man vs Zone vs Press)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches need to know which defensive scheme is most effective against the current opponent's offensive style. PPP allowed by scheme is the ultimate truth.
**What:** Introduce "Defensive Scheme" tagging. Allow coaches to toggle the current defensive set (e.g., 2-3 Zone, Man-to-Man) in GameMode. All opponent scoring events are then attributed to the active scheme.
**Acceptance Criteria:**
- [ ] "Active Defense" toggle in GameMode (options: Man, Zone, Press, Special).
- [ ] Track PPP Allowed for each scheme within the current game.
- [ ] "Defensive Efficiency by Scheme" table in GameStats.
- [ ] Season-wide analytics comparing scheme performance against different opponent archetypes.
**Status:** [ ] COMPLETE

## [ ] In-Game Tactical Goals & KPI HUD
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches enter games with specific tactical objectives (e.g., "Keep them under 8 offensive rebounds"). Live tracking of these KPIs keeps the team focused on the game plan.
**What:** Add a "Tactical Goals" section to Team Settings where coaches can set numeric targets for a game. Display a live "Goal Progress" HUD in GameMode.
**Acceptance Criteria:**
- [ ] CRUD interface in Team Settings to define "Tactical Goals" (e.g., < 10 TOs, > 15 AST, < 30% Opp 3PT).
- [ ] "Goal HUD" in GameMode showing real-time progress (e.g., "Offensive Rebounds: 4/8").
- [ ] Visual celebration/alert when a goal is achieved or a limit is breached.
- [ ] Post-game "Goal Performance" summary in GameStats.
**Status:** [ ] COMPLETE

## [ ] Live "Film Room" Event Bookmarking
**Priority:** HIGH
**Type:** UX
**Why:** Reviewing game film is tedious when you have to hunt for specific moments. One-tap bookmarking during the game allows coaches to jump straight to critical plays for post-game study.
**What:** Add a "Bookmark" (Star) icon to the recent actions list and a "Flag Play" button to the quick actions. These flagged events are highlighted in the post-game summary and exported CSVs.
**Acceptance Criteria:**
- [ ] "Flag Play" button in GameMode for immediate bookmarking of the last event.
- [ ] Bookmark icons next to each event in the Recent Actions list.
- [ ] "Key Moments" filter in the GameStats event log.
- [ ] Exportable list of bookmarked events with timestamps for easy film synchronization.
**Status:** [ ] COMPLETE

## [ ] HALT (High-Leverage Alerting) System
**Priority:** HIGH
**Type:** Enhancement
**Why:** Critical game situations (e.g., a star player with 3 fouls in the 1st half) require immediate tactical shifts. Automated alerts ensure coaches never miss a high-leverage decision window.
**What:** Implement a "High-Leverage Alert" engine that monitors game state and triggers intrusive HUD warnings for critical tactical scenarios.
**Acceptance Criteria:**
- [ ] "Star Player Foul Warning" (e.g., 2 fouls in Q1, 3 in Q2).
- [ ] "Bonus Approaching" alert when an opponent is at 4 fouls in a quarter.
- [ ] "Time to Sub" fatigue alerts based on live stint duration vs target minutes.
- [ ] "Clutch Mode" activation alert when entering the final 4 mins of a close game.
**Status:** [ ] COMPLETE
