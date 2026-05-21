# CourtSight Backlog

## [ ] [Live 'Momentum Pivot' Identifier]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Coaches need to know the *exact* moment momentum shifted. Identifying the "Pivot Play"—the specific turnover, missed box-out, or substitution that ended a run or started a drought—allows for surgical coaching interventions during the next timeout.
**What:** A real-time intelligence layer that identifies and bookmarks the "Pivot Play" for every 8+ point swing or 3-minute drought.
**Acceptance Criteria:**
- [ ] Automated identification of the "Momentum Pivot" event (the stat that triggered a trend reversal).
- [ ] "Pivot Alert" in GameMode with a one-tap "Review Pivot" to see the personnel on floor and the causal breakdown.
- [ ] High-leverage "Pivot Summary" in the post-game report.

## [ ] [Real-Time 'System ROI' (Spacing & Gravity) Gauge]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Modern basketball is about spacing and gravity. Tracking the correlation between "Paint Touches" and "Open Corner 3s" proves the offensive "System" is working even if the shots are missing, preventing coaches from abandoning a good process too early.
**What:** A live "System ROI" gauge that tracks "Gravity-Assisted XPTS"—points generated specifically from paint-out actions (Paint Touch -> Kickout -> Shot).
**Acceptance Criteria:**
- [ ] "Gravity ROI" metric in TacticalIdentityHUD: (XPTS generated from Paint-to-Perimeter flow).
- [ ] Visual "Flow Path" indicator showing if the ball is moving from "In" to "Out."
- [ ] Alert: "System Breakdown" when 3 consecutive possessions end without a rim attack or paint touch.

## [ ] [Defensive 'Communication Seam' (Pairwise) Analytics]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Defensive failures are rarely about one person; they are about communication seams between pairs (e.g., a missed switch). Identifying "Leaky Duos" helps coaches optimize closing lineups.
**What:** An analytical engine that cross-references `breakdownReason` with active 2-player pairings to identify which duos have the highest communication failure rates.
**Acceptance Criteria:**
- [ ] "Seam Leaderboard" identifying the 5 top 2-player pairings with the highest points-allowed-per-possession.
- [ ] "Synergy Warning" in the QuickSubDialog if a high-risk pair (high breakdown correlation) is about to be subbed in together.
- [ ] Matrix mapping breakdown types (e.g., "Missed Rotation") to specific synergistic pairings.

## [ ] [Referee 'Aggression Auditor' (Action-Type Mapper)]
**Priority:** HIGH
**Type:** Decision Support / Feature
**Why:** Knowing "The refs are calling it tight" is too vague. Coaches need to know *where* and *how* (e.g., "They are calling hand-checks on drives but letting them play in the post"). This dictates tactical aggression levels.
**What:** A situational map that correlates fouls with `StatEvent` coordinates and action types to identify "Ref No-Go Zones."
**Acceptance Criteria:**
- [ ] "Aggression Map" overlay in the TeamStatsCard showing regions and action types where fouls are called disproportionately.
- [ ] "Tactical Pivot" advice: e.g., "Refs calling perimeter hand-checks tight; adjust to 'Soft' ball-pressure."
- [ ] Whistle-flow trend line showing if the crew's "Tightness" is increasing or decreasing over the periods.

## [ ] [Automated 'Winning Time' Win Probability HUD]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** In the final 2 minutes of a close game, a coach's judgment is often clouded by stress. A live "Win Probability" engine provides an objective baseline for "Foul Now" vs "Play Out" decisions.
**What:** A live probability engine that activates in the final 4 minutes, calculating win odds based on Time, Score, Possession, and Team FT%.
**Acceptance Criteria:**
- [ ] Live "Win Prob %" display in the scoreboard during Clutch Mode.
- [ ] "Strategy Directive" based on probability (e.g., "Quick 2 Needed" or "Foul Immediately").
- [ ] "Leverage Index" highlighting the highest-leverage defensive possessions remaining.

## [ ] [Live 'Possession Value' ROI (Points Per Touch)]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Modern coaching requires "Buy-In" on unselfishness. Quantifying the points generated per touch (PPT) transforms "ball-hogging" from a critique into a mathematical process failure.
**What:** A live "Possession Equity" leaderboard that calculates Points Generated (Points + Points from Assists) divided by Total Touches.
**Acceptance Criteria:**
- [ ] "Equity Score" (PPT) column in the GameMode player table.
- [ ] Real-time identification of "Possession Efficiency Gaps" (High touch count but low points generated).
- [ ] A "Touch Flow" indicator showing if the ball is "sticking" (Touches without subsequent passes/shots).

## [ ] [Visual 'Run Anatomy' & Momentum Causal Breakdown]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Identifying a run is easy; identifying the *source* is coaching. Surgical adjustments require knowing if an 8-0 run was caused by "Transition Leakage," "Rebounding Failure," or "Scheme Breakdown."
**What:** A high-contrast "Run Anatomy" HUD that activates during an Opponent Run alert, categorizing the causal factors of the opponent's momentum.
**Acceptance Criteria:**
- [ ] "Anatomy Gauge" showing % of run points from: Second Chance, Fast Break, and Paint.
- [ ] "Lineup Accountability": Highlighting which our unit was on the floor for the majority of the run.
- [ ] One-tap "Tactical Pivot" recommendation (e.g., "Full-Court Press" or "Force Middle") based on the anatomy.

## [ ] [Automated 'Practice Prescription' Generator]
**Priority:** HIGH
**Type:** UX / Workflow
**Why:** The gap between game-time failure and practice-time correction is where seasons are lost. Automating the bridge between live "Bookmarked" events and a formal practice plan ensures zero "Tactical Drift."
**What:** A system that aggregates "Practice Bookmarks" and "Defensive Breakdowns" into a downloadable "Practice Prescription" PDF.
**Acceptance Criteria:**
- [ ] One-tap "Practice Bookmark" on the Recent Action HUD.
- [ ] "Prescription Engine" that identifies the top 3 tactical failures (e.g., "Transition Defense") based on frequency of breakdowns.
- [ ] Exportable PDF with a summary of teaching moments, associated players, and timestamps.

## [ ] [Strategic 'End-of-Clock' & 'Foul-to-Give' Tactical HUD]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** The final 60 seconds is "Winning Time." Mental fatigue often leads to errors in "Foul-to-Give" math or "Advance" rules. This HUD automates the tactical math so the coach can focus on the play.
**What:** A specialized "End-of-Clock" HUD that activates in the final 2 minutes of the game, surfacing situational math.
**Acceptance Criteria:**
- [ ] Persistent "Fouls to Give" display (for both teams).
- [ ] "Timeout Advance Status": Visual confirmation if taking a timeout allows the ball to advance.
- [ ] "Tactical Directives": e.g., "Foul to Give: Agressive Defense" or "Zero Fouls to Give: No Reaching."

## [ ] [Elite Program: Multi-Device 'Scout-to-Bench' Sync Bridge]
**Priority:** HIGH
**Type:** Feature / Infrastructure
**Why:** Elite programs use "Two-Man Coverage"—a scorekeeper behind the bench and a coach on the sideline. Real-time sync ensures the coach has live data on a tablet while the assistant tracks the game.
**What:** A real-time websocket or polling-based sync bridge that allows two devices to share the same game state with <500ms latency.
**Acceptance Criteria:**
- [ ] "Join as Observer" mode for secondary devices.
- [ ] Real-time updates of the Scoreboard and Tactical HUDs on the observer device.
- [ ] Conflict-free stat entry (primary device only for writes, or locked writes).

## [ ] [Live 'Tactical Adherence' Auditor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Coaches set a "Game Plan" (e.g., "No middle drives", "Force them left"), but in the heat of the game, players drift. This tool measures real-time adherence to tactical goals.
**What:** An overlay that tracks specific defensive constraints (e.g., % of drives allowed to the middle) and provides a "Tactical Grade" during timeouts.
**Acceptance Criteria:**
- [ ] Configurable "Game Plan Constraint" selector in GameMode.
- [ ] Live "Adherence Grade" based on StatEvents matching (or violating) the constraint.
- [ ] "Alert: Tactical Drift" when violations exceed 3 in a single period.

## [ ] [Opponent Substitution 'Pattern Matcher']
**Priority:** HIGH
**Type:** Feature / Predictive Intelligence
**Why:** Opponent coaches have substitution "tells" (e.g., "They always sub their star back in at the 4:00 mark"). Anticpating these moves allows for preemptive counter-subs.
**What:** An engine that analyzes opponent `SUB_IN`/`SUB_OUT` timestamps across games to predict their next rotation move.
**Acceptance Criteria:**
- [ ] "Rotation Alert" in GameMode: "Opponent #24 expected to return in ~60 seconds."
- [ ] Suggested counter-lineup based on historical success against that specific opponent sub pattern.
- [ ] Visual timeline of opponent rotation "nodes" across the game.

## [ ] [Huddle 'Impact' Reality Check]
**Priority:** HIGH
**Type:** UX / Coaching Support
**Why:** Halftime and Timeout huddles are often based on the last 3 plays. A "Reality Check" surfaces the most significant deviation from the season mean to ensure adjustments are evidence-based.
**What:** A high-contrast "Huddle Card" that identifies the ONE thing the team is doing significantly worse (or better) than their season average.
**Acceptance Criteria:**
- [ ] One-tap "Huddle Card" in the Sidebar.
- [ ] Automatic identification of the "Metric Outlier" (e.g., "Turnover rate is 12% higher than season average").
- [ ] Comparison of the "Outlier" to the current score spread: "Fixing this TO rate = +8 points expected."

## [ ] [Lineup 'Rust vs. Rhythm' Optimizer]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Managing "Bench Rust" is an art; the Optimizer makes it a science. It suggests exactly when a star player's "Rhythm" is maximized versus when "Rust" (stiffness/coldness) will set in.
**What:** Enhance the "Bench Rust" factor with a "Rhythm Decay" curve that predicts efficiency based on time-since-last-stint.
**Acceptance Criteria:**
- [ ] "Optimal Re-entry Window" highlight on bench cards.
- [ ] "Rust Warning" when a player has been sitting for > 10 game minutes.
- [ ] Correlation of "Stint 1 Efficiency" to "Stint 2 Rhythm" to predict individual player warm-up needs.

## [ ] [Unit 'Familiarity & Synergy' Risk Advisor]
**Priority:** HIGH
**Type:** Decision Support / Analytics
**Why:** Desperation lineups often fail due to lack of shared experience. Units with low "Shared Minutes" have higher communication failure rates.
**What:** A "Familiarity Meter" on the lineup HUD that shows the total season minutes the current 5-man unit has played together.
**Acceptance Criteria:**
- [ ] "Familiarity Score" (Total Shared Minutes) displayed for the active lineup.
- [ ] Visual warning: "High Communication Risk" for units with < 10 shared minutes.
- [ ] Net Rating comparison: Current Unit vs. Season Average for that unit.

## [ ] [Live Personnel Tendency 'Assistant' Alerts]
**Priority:** HIGH
**Type:** Operational Intelligence
**Why:** Automating the observation of patterns (e.g., "He always drives left") allows the coach to adjust the game plan in real-time.
**What:** Real-time alerts when an opponent player exceeds a tendency threshold (e.g., specific drive direction or shot type).
**Acceptance Criteria:**
- [ ] Trigger alert: "Opponent #[X] has driven LEFT on 80% of touches."
- [ ] HUD highlight on the opponent card when a tendency is identified.
- [ ] Suggested defensive adjustment (e.g., "Shade Left").

## [x] [Defensive 'Shell' Integrity & Paint ROI Tracker]
**Priority:** HIGH
**Type:** Analytics / Feature
**Why:** structural health of the defense is measured by paint entries. Tracking how often the opponent gets "Into the Paint" regardless of the score identifies process failures.
**What:** A live gauge tracking "Paint Entry Rate" vs "Season Goal," providing a "Shell Integrity" grade.
**Acceptance Criteria:**
- [ ] "Shell Integrity" grade (A-F) based on opponent paint touches per possession.
- [ ] Correlation of paint entries to subsequent points allowed.
- [ ] Alert when Paint Entry Rate exceeds 40% of possessions.

## [ ] [Live Bench 'Rust' Factor & Re-entry Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Star players often struggle with rhythm after long stretches on the bench. Tracking "Bench Rust" (cumulative game time since last stint) removes the guesswork of when a player is getting too cold to contribute immediately.
**What:** Implement a "Rust Factor" indicator for bench players that tracks game clock minutes since their last SUB_OUT.
**Acceptance Criteria:**
- [ ] Visual "Rust Meter" on bench player cards in GameMode (e.g., turns blue after 6 mins).
- [ ] Visual progress bar indicating 'Rhythm Decay' on bench cards.
- [ ] "Star Return Alert" for players with `isStar: 1` who have been sitting for more than 25% of the total game time.
- [ ] Integration with the HALT system to prioritize warming up cold stars.

## [ ] [Defensive 'Communication Seam' Identifier]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Defensive failures are often about pairs of players missing rotations together. Identifying "Leaky Duos" helps coaches avoid non-synergistic lineups.
**What:** Correlation analytics that identify pairs of players who are consistently on the floor together during "Defensive Breakdowns" (StatEvents with a `breakdownReason`).
**Acceptance Criteria:**
- [ ] "Seam Leaderboard" in GameStats showing 2-player pairings with the highest points-allowed-per-possession.
- [ ] "Communication Alert" in GameMode if a high-risk pair is substituted in together.
- [ ] Visual matrix mapping breakdown types (e.g., "Missed Rotation") to specific defensive pairs.

## [ ] [Possession ROI: 'Set Play' vs. 'Scramble' Efficiency]
**Priority:** HIGH
**Type:** Enhancement / Analytics
**Why:** Coaches spend hours on playbooks. They need to prove that "Set Plays" (stat with `playName`) are actually more efficient than "Scramble" play (stat without `playName`).
**What:** A comparative analytics engine that calculates the ROI of running the playbook vs. playing in flow/transition.
**Acceptance Criteria:**
- [ ] "Playbook ROI" gauge in GameStats comparing PPP on Sets vs PPP on Scramble.
- [ ] "Play Type Success Rate" for ATO (After Timeout) and SLOB/BLOB situations specifically.
- [ ] Identification of the "Empty Possession" rate for called plays (possessions ending in TO or blocked shot).

## [ ] [Optimal 'Clutch' Lineup Suggester]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** In the final 4 minutes of a close game, a coach's "gut feeling" on who should be in the game can be clouded by stress. A data-driven suggester removes the bias.
**What:** An intelligence layer for the "Winning Time" HUD that recommends the mathematically optimal 5-man unit based on live Net Rating, FT reliability, and current fatigue.
**Acceptance Criteria:**
- [ ] "Recommended Closers" list surfaced when Clutch Mode is active.
- [ ] "Reliability Index" for on-court players combining FT% and TO rate.
- [ ] One-tap "Closing Sub" button that triggers the multi-player substitution workflow.

## [x] [Voice-Command Substitution Entry]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Substitutions are high-friction events. Voice commands ("Sub 12 for 5") allow scorekeepers to keep eyes on the court while maintaining perfect lineup data.
**What:** Expand `useVoiceRecognition.ts` and `voiceParser.ts` to support substitution intent.
**Acceptance Criteria:**
- [x] Parse "[Jersey] in for [Jersey]" and "[Jersey] sub [Jersey]" commands.
- [x] Auto-generate `SUB_IN` and `SUB_OUT` events in IndexedDB.
- [x] Visual HUD confirmation: "Lineup Updated: #12 IN, #5 OUT."

## [x] [Live Defensive Breakdown Accountability HUD]
**Priority:** HIGH
**Type:** Feature / Analytics
**Why:** Tracking *why* an opponent scored (e.g., "Missed Rotation") is the difference between a scorebook and a coaching tool.
**What:** A sidebar widget in `GameMode` that aggregates `breakdownReason` and attributes them to the `primaryDefenderId`.
**Acceptance Criteria:**
- [x] Real-time "Breakdown Leaderboard" (Reasons and Players responsible).
- [x] "Accountability Index": Points Allowed per defender normalized by frequency of breakdowns.
- [x] One-tap breakdown attribution during the opponent score workflow.

## [ ] [Predictive Foul Strategy Substitution Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Managing stars in foul trouble is high-stress. An advisor removes the "gut feeling" by calculating the risk of disqualification vs. time remaining.
**What:** A HUD element that calculates "Foul Risk" (Possessions remaining / Fouls available).
**Acceptance Criteria:**
- [ ] "Foul Risk" badge on lineup buttons (LOW/MED/HIGH).
- [ ] "Suggested Return" clock time for players sitting with foul trouble.
- [ ] Alert when opponent star is in foul trouble to drive "Target Attack" strategy.

## [ ] [Multi-Game Persistent Scouting Integration]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches play the same teams multiple times. Persistent IDs allow for a "Scouting Report" that builds automatically over the season.
**What:** Bridge `OpponentScoutingReport` with `GameMode` to load historical tendencies.
**Acceptance Criteria:**
- [ ] Auto-load "Tendency Badges" (e.g., "Drives Left", "3PT Threat") on opponent cards.
- [ ] Save/Load opponent rosters from the "Opponent Library."
- [ ] Cumulative matchup history: "Player X has a 70% Stop Rate against this opponent over 3 games."

## [ ] [Shot Clock Process ROI Gauge]
**Priority:** HIGH
**Type:** Enhancement / Analytics
**Why:** Offensive discipline is measured by shot quality relative to time used. "Settling" early in the clock is a process failure even if the shot goes in.
**What:** A visualization in `GameStats` comparing efficiency across EARLY (0-8s), MID (9-16s), and LATE (17-24s) phases.
**Acceptance Criteria:**
- [ ] "Process Gauge" showing eFG% vs Expected eFG% by shot clock phase.
- [ ] Identification of "Efficiency Killers": Low-quality shots taken early in the possession.
- [ ] Post-game "Discipline Grade" for the team's offensive process.

## [x] [Live On/Off Team Impact HUD]
**Priority:** HIGH
**Type:** Feature / Analytics
**Why:** Plus/Minus is noisy. On/Off Net Rating shows a player's true relative value. Knowing the team is -10.0 per 100 possessions when Player X sits is the ultimate subbing directive.
**What:** A live "Impact HUD" that shows the On/Off Net Rating delta for all rostered players relative to the current game's pace.
**Acceptance Criteria:**
- [ ] "Impact" column in the GameMode player table showing (Team Net Rating ON) - (Team Net Rating OFF).
- [ ] Color-coded "Relative Value" pips (Green: Team better with them, Red: Team better without).
- [ ] Integration into the "Halt" fatigue alert (e.g., "Player X is tired but Team is -15 with them OFF").

## [ ] [Post-Game "Process vs. Result" Scorecard]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Coaches need to know if they lost because of "bad luck" (cold shooting on good looks) or "bad process." Separating shot quality from the result preserves team confidence.
**What:** An automated post-game report that compares "Actual Score" vs "Expected Score" (based on xPTS/Shot Quality).
**Acceptance Criteria:**
- [ ] "Process Report Card" in GameStats (A through F grade based on Shot Quality ROI).
- [ ] "Win/Loss Logic" breakdown: "We lost the game but won the process (Shot Quality +12%)."
- [ ] Identification of the "Process MVP" (Player with highest xPTS creation regardless of makes).
      
## [ ] [Strategic Timeout & Game State Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Timeout management in the 4th quarter is high-stress. An advisor removes the mental math of "How many do we have left?" and "Is this the right time?"
**What:** A decision-support engine that analyzes Momentum, Timeouts Remaining, and Score Spread to suggest optimal timeout windows.
**Acceptance Criteria:**
- [ ] "Timeout Advisor" HUD element that glows when a timeout is mathematically recommended (e.g., 8-0 Opponent run).
- [ ] "Winning Time" logic: Specialized advice for the final 2 minutes (e.g., "Save one for the advance").
- [ ] Visual indicator of "Effective Timeouts" relative to the game's remaining pace.

## [ ] [Opponent Play-Type "Counter-Strike" Analytics]
**Priority:** HIGH
**Type:** Feature
**Why:** Knowing an opponent is scoring on "PnR" is step one. Knowing *how* to stop it (e.g., "Switch" vs "Hedge") based on their efficiency is the winning adjustment.
**What:** Enhance Opponent Play-Type tracking to recommend specific defensive adjustments based on live PPP.
**Acceptance Criteria:**
- [ ] Live indicator in GameMode: "Opponent scoring 1.4 PPP on PnR."
- [ ] "Adjustment Suggestion" based on active scheme (e.g., "Switch screens to neutralize #24").
- [ ] Post-game breakdown in GameStats showing "Points Allowed by Action Type x Our Scheme."

## [ ] Dynamic "Target Attack" Identifier
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often miss which opponent defender is the "weak link" or which specific matchup is most exploitable in real-time. This tool automates the identification of mismatches to drive play-calling.
**What:** Implement an intelligence layer that correlates Matchup Tracking with Points Per Possession (PPP). It should highlight which opponent player is allowing the highest PPP and suggest which of our players should be the primary attacker.
**Acceptance Criteria:**
- [ ] Live HUD element in GameMode showing "Top Attack Target" (Opponent Jersey #).
- [ ] Real-time "Mismatch Alert" when a specific defender's Stop % drops below a configurable threshold.
- [ ] "Targeted Play" recommendation based on which of our players has the best eFG% against that specific defender's archetype.

## [ ] Automated Post-Game Player Performance Narratives
**Priority:** HIGH
**Type:** Feature
**Why:** Players often don't understand raw stats. Converting data into "Narratives" (e.g., "You were elite at closing out but struggled with ball security") makes coaching feedback more digestible and actionable.
**What:** Use the accumulated StatEvents to generate a 3-sentence performance summary for every player who played > 5 minutes.
**Acceptance Criteria:**
- [ ] "Player Feedback" section in the Game Stats page.
- [ ] Automated generation of one "Strength" (e.g., "High Efficiency from Corner 3") and one "Growth Area" (e.g., "High TO rate on drives").
- [ ] Ability for the coach to "Approve & Send" the narrative to the player via text/email.

## Standardized Video Platform Export (Hudl/Synergy)
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches spend hours manually tagging film. Exporting our granular game data into formats compatible with Hudl, Synergy, or VidSwap bridges the gap between stats and film.
**What:** Create an export engine that generates CSV or XML files mapped to the specific column requirements of major video analysis platforms.
**Acceptance Criteria:**
- [ ] "Export for Video" button in Game Stats.
- [ ] Dropdown to select platform (Hudl, Synergy, VidSwap).
- [ ] Export includes `clockTime`, `period`, `playerName`, `actionType`, and `playName`.
- [ ] Properly formatted CSV/XML file downloaded to the user's device.

## Program-Wide Tactical KPI Dashboard
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to see if their team's identity (e.g., "We are a transition team") is holding up over months, not just individual games.
**What:** Build a longitudinal dashboard that tracks specific team-defined KPIs (e.g., OREB%, TO Rate, PPP) across the entire season with trend lines.
**Acceptance Criteria:**
- [ ] New "Program Health" tab on the Dashboard/My Team page.
- [ ] Multi-game trend charts for the "Four Factors."
- [ ] "Identity Goals" section where coaches see % of games where goals were met.
- [ ] Filter by date range or opponent strength.

## [ ] ["Hockey Assist" (Secondary Assist) & Playmaking Chain]
**Priority:** HIGH
**Type:** Feature
**Why:** The player who makes the "extra pass" often goes unrewarded in traditional stats. Identifying secondary assists reveals the true floor generals who drive offensive flow.
**What:** Allow for a secondary "Hockey Assist" to be recorded during the "Who Assisted?" chain.
**Acceptance Criteria:**
- [x] Enhance "Teammate Assist?" overlay to allow selecting a second player for a "Hockey Assist."
- [x] "Hockey Assist" column in the Box Score and Player Stats.
- [ ] "Offensive Flow Rating" per player: (Assists + Hockey Assists) / Possessions.

## [ ] [Lineup "Defensive Synergy" (Lineup x Scheme Efficiency)]
**Priority:** HIGH
**Type:** Feature
**Why:** Some 5-man units are elite in a 2-3 Zone but struggle in Man-to-Man. Identifying these synergies allows for precise defensive substitutions based on the active scheme.
**What:** Build a matrix in GameStats that cross-references Lineup Efficiency with the Active Defensive Scheme.
**Acceptance Criteria:**
- [ ] "Scheme Synergy" table in GameStats showing PPP Allowed by Lineup *filtered by* Defensive Scheme.
- [ ] "Best Scheme" recommendation for the currently active on-court lineup.
- [ ] Identification of "Defensive Anchor" duos who maintain low PPP across all schemes.

## [ ] [Scoring Run & Drought "Coaching Alerts"]
**Priority:** HIGH
**Type:** Feature
**Why:** Coaches often lose track of momentum shifts during the heat of the game. Real-time alerts for "10-0 Runs" or "3-Minute Droughts" act as a data-driven trigger for timeouts.
**What:** Monitor the live event stream for scoring patterns. Trigger a visual HUD alert in `GameMode` when specific momentum thresholds are met.
**Acceptance Criteria:**
- [x] Trigger "Opponent Run" alert (e.g., 8-0 or 10-2 run) in the scoreboard area.
- [ ] Trigger "Scoring Drought" alert if "Our Team" has not scored for X consecutive minutes of game clock.
- [ ] Alerts should include a "Suggest Timeout" visual cue.
- [ ] Thresholds should be configurable in Team Settings (default: 8 points for a run, 3 minutes for a drought).

## [ ] [Real-Time Opponent Threat Alerts]
**Priority:** HIGH
**Type:** Enhancement
**Why:** In the heat of the game, a bench player on the opposing team can hit three 3-pointers before a coach even notices. Immediate alerts on "Unchecked Threats" prevent games from slipping away.
**What:** Monitor opponent scoring patterns and trigger HUD alerts in GameMode when an opponent player exceeds their season average or reaches a scoring milestone (e.g., "Opponent #24 is 4/4 from 3PT").
**Acceptance Criteria:**
- [ ] Scoreboard HUD alert: "THREAT ALERT: Player X has scored 10 straight points."
- [ ] Indicator on the "Opponent Tracking" card showing current hot/cold status of active opponent players.
- [ ] Suggestion to change defensive assignment or call timeout when a threat threshold is met.

## [ ] [Locker Room] Post-Game Learning System
**Priority:** HIGH
**Type:** UX
**Why:** The learning gap between games is where championships are won. A guided review mode turns a static box score into an interactive teaching tool for coaches and players.
**What:** Implement a "Coaching Clinic" mode in the Game Stats page that automatically identifies and walks through the 5 most critical game-changing moments.
**Acceptance Criteria:**
- [ ] "Start Clinic" button in Game Stats.
- [ ] Guided walkthrough identifying: 3 "Execution Wins" and 3 "Tactical Errors" based on PPP and Score Flow.
- [ ] Integrated "Momentum Shift" analyzer that highlights the specific play or sub that triggered a scoring run.
- [ ] "Coach's Reflection" text area to save takeaways for the next practice plan.

## [ ] Automated Referee Profile HUD
**Priority:** HIGH
**Type:** Feature
**Why:** Referee "tightness" (fouls per minute) and bias (home/away split) should dictate how aggressive a team plays. A coach who knows the ref is calling it tight can adjust defensive pressure before foul trouble hits.
**What:** An intelligence layer that analyzes the frequency and distribution of fouls called by the current officiating crew.
**Acceptance Criteria:**
- [x] "Ref Tightness Meter" in GameMode comparing current game Fouls Per Minute (FPM) against a historical baseline.
- [ ] "Foul Bias" indicator showing the split between Our Team vs Opponent fouls.
- [x] "Aggression Advisor" suggesting "Press Hard" or "Play Soft" based on FPM.

## [ ] Program-Wide "Tactical DNA" Comparison
**Priority:** HIGH
**Type:** Feature
**Why:** A season is a marathon. Coaches need to know if their team is evolving or regressing in their core identity (e.g., "Are we still an elite rebounding team?").
**What:** A longitudinal comparison tool that overlays current game "Four Factors" against the season-to-date "DNA" blueprint.
**Acceptance Criteria:**
- [ ] "Program DNA" Radar Chart in GameStats.
- [ ] Overlay of "Last 3 Games" vs "Season Average" to identify recent trends.
- [ ] "Identity Crisis" alert if more than 3 of the Four Factors deviate by >15% from the season mean.

## Multi-Game Shot Location Trend Analysis
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A team's shooting identity shifts throughout a season. Identifying that a team has stopped attacking the rim over the last 5 games allows for immediate practice adjustments.
**What:** Implement a "Trend Mode" for the Team Heatmap.

## Predictive Foul Strategy Assistant
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Managing foul trouble for star players is a high-stakes balancing act.
**What:** Implement a predictive model in the GameMode that calculates "Foul Risk".

## Interactive Halftime "Adjustment Board"
**Priority:** MEDIUM
**Type:** Feature
**Why:** Halftime is the most critical window for tactical pivots.
**What:** Enhance the Halftime Report with an interactive "Adjustment Board".

## Advanced Opponent Drive & Finish Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Knowing a player is "Hot" is good; knowing they always drive LEFT and finish with a FLOAT is game-changing.
**What:** Enhance the opponent shot recording to include "Drive Direction".

## "Blue Collar" Hustle & Identity Tracker
**Priority:** MEDIUM
**Type:** Feature
**Why:** Winning teams are built on "Hustle Stats" (Deflections, Dives, Great Contests).
**What:** Add a dedicated "Hustle Mode" toggle in GameMode.

## Predictive Performance & Fatigue Modeling
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A player's impact doesn't drop off exactly at 8 minutes.
**What:** Build a model that compares a player's live stint efficiency against fresh-state averages.

## Live Opponent Personnel Intelligence HUD
**Priority:** MEDIUM
**Type:** UX
**Why:** Scouting reports are often forgotten in the heat of a game.
**What:** Integrate persistent scouting notes into the live GameMode opponent cards.

## Longitudinal Official/Referee Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Officiating is the "Third Team" on the court.
**What:** Implement a season-wide database of officiating stats.

## Program-Wide Optimal Rotation Optimizer
**Priority:** MEDIUM
**Type:** Feature
**Why:** Managing a roster across a long season requires identifying which units are mathematically most effective.
**What:** A prescriptive engine that analyzes season-wide unit data.

## [ ] Persistent Opponent Scouting Database
**Priority:** MEDIUM
**Type:** Feature
**Why:** Coaches often play the same opponents multiple times in a season. Re-identifying jersey numbers every game is tedious and prevents historical scouting analysis.
**What:** Allow "Opponent Rosters" to be saved and reused across multiple games. When starting a game, allow the user to select an existing opponent team and load their previously identified roster.
**Acceptance Criteria:**
- [ ] New "Opponent Library" section or a way to save an opponent's `opponentRoster` from the Game Mode.
- [ ] "Load Roster" option in Create Game workflow for selected opponents.
- [ ] Cumulative "Opponent Scouting Report" view showing a player's stats across all games where they were tracked via a persistent ID.

## [ ] Multi-Period Tactical Heatmaps
**Priority:** MEDIUM
**Type:** Feature
**Why:** Shooting patterns change as a game progresses due to fatigue or defensive adjustments. Coaches need to see *when* their team stopped getting to the rim.
**What:** Enhance the Shot Chart in `GameStats` and `Dashboard` to allow filtering heatmaps by specific period or "Half."
**Acceptance Criteria:**
- [ ] Period-selector filter (P1, P2, P3, P4, OT) on the Shot Chart view.
- [ ] "Compare Periods" mode showing two heatmaps side-by-side (e.g., 1st Half vs 2nd Half).
- [ ] Toggle to show "Only Misses" or "Only Makes" on the heatmap.

## [ ] Interactive Playbook Efficiency HUD
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** Coaches need to know *during* the game if a specific offensive set is failing. Waiting for post-game stats to stop running an inefficient play is too late.
**What:** Add a "Playbook Performance" widget to the `GameMode` sidebar that shows the success rate (PPP) of the top 3 most-used plays in the current game.
**Acceptance Criteria:**
- [ ] Sidebar widget in GameMode showing Play Name, Frequency, and Points Per Possession (PPP).
- [ ] Color-coded efficiency indicator (Green/Yellow/Red) based on team-average PPP.
- [ ] One-tap access to see the shot chart for a specific play during timeouts.

## [ ] Shot Quality & Process Tagging
**Priority:** MEDIUM
**Type:** Enhancement
**Why:** A "good" shot can miss and a "bad" shot can go in. Coaches need to evaluate the *process* of their offense, not just the result, to make halftime adjustments.
**What:** Add an optional "Shot Quality" toggle to the `MAKE`/`MISS` recording dialog (e.g., "Open" vs "Contested").
**Acceptance Criteria:**
- [ ] Add `shotQuality` (OPEN, CONTESTED) to the `StatEvent` schema.
- [ ] Add a simple toggle or button group in the shot recording dialog to tag quality.
- [ ] Display "Process Efficiency" in `GameStats` (e.g., "EFG% on Open Shots" vs "EFG% on Contested Shots").
- [ ] Filter Shot Chart by Shot Quality.

## [ ] Interactive Game Flow & Momentum Chart
**Priority:** MEDIUM
**Type:** UX
**Why:** Box scores are static. A flow chart shows *when* the game was won or lost and how specific lineups affected the lead.
**What:** Add a "Game Flow" visualization to the `GameStats` page—a line graph showing the point spread over the course of the game clock.
**Acceptance Criteria:**
- [x] Interactive line chart showing `Our Score - Opponent Score` on the Y-axis and `Game Time` on the X-axis.
- [x] Mark key events on the timeline (Timeouts, Period ends).
- [x] Hovering over the line shows the score and active lineup at that specific time.
- [x] Color-code the background to show who was "in control" (e.g., blue for home lead, red for away lead).

## [ ] Multi-Game Lineup Net Rating Analytics
**Priority:** MEDIUM
**Type:** Feature
**Why:** Single-game Plus/Minus can be noisy. Coaches need to know which 5-man combinations are most effective over a season or tournament.
**What:** Aggregate lineup performance data across multiple games for a team.
**Acceptance Criteria:**
- [ ] New "Lineup Analytics" tab on the `TeamStats` or `My Team` (Dashboard) page.
- [ ] Table of 5-man units (lineups) that have played together.
- [ ] Metrics per lineup: Total Minutes, Points For, Points Against, Net Rating (Diff per 100 possessions or per 40 mins).
- [ ] Ability to filter by "Last 5 Games" or "Season".

## [UX] Epic: Administrative Workflow & Dashboard Streamlining
**Priority:** MEDIUM
**Type:** UX / Enhancement
**Why:** Current administrative workflows (game creation, team editing) are high-friction, and the dashboard lacks actionable information.
**What:** Redesign the administrative experience to be workflow-driven and transform the dashboard into a high-value "My Team" hub.
**Acceptance Criteria:**
- [ ] Replace static Dashboard with a dynamic "My Team" hub driven by "Star Team" selection.
- [ ] Implement a multi-step workflow for the `Create Game` dialog (Opponent -> Date/Time -> Settings).
- [ ] Update `Edit Team Details` to include global game defaults (period lengths, foul limits, timeout counts).

## [Live Timeout Huddle Snapshot]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Coaches have only 60 seconds during a timeout. Surfacing the 3 most critical tactical data points (e.g., "Opponent Run PPP," "Our Best Active Lineup," and "Execution Gap") removes the mental fog of high-pressure moments.
**What:** A dedicated "Huddle Mode" button in GameMode that opens a full-screen, high-contrast overlay with three actionable directives.
**Acceptance Criteria:**
- [ ] "One-Tap Huddle" button in GameMode.
- [ ] Logic to identify the 3 most significant outliers (e.g., specific player hot/cold, specific scheme failure).
- [ ] High-contrast, large-font UI designed to be readable from 3 feet away.

## [Referee Situational Bias & Whistle Flow HUD]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Officiating is often inconsistent across different game contexts (e.g., "Calling it tight on drives" vs "Letting them play in transition"). Identifying these patterns allows coaches to adjust aggression.
**What:** Enhance the Referee Profile to track foul frequency by action type (Drives, Post-ups, Perimeter) and period-over-period whistle flow.
**Acceptance Criteria:**
- [ ] "Whistle Flow" chart showing Fouls Per Possession over the course of the game.
- [ ] "Bias Indicator" identifying if fouls are disproportionately called against a specific player or action type.
- [ ] Alert: "Refs calling perimeter hand-checks tight; adjust defense."

## [Rim Pressure 'Gravity' & Kick-Out Analytics]
**Priority:** HIGH
**Type:** Enhancement / Analytics
**Why:** Paint touches are valuable not just for shots, but for "Gravity"—collapsing the defense to create open 3s. Identifying who generates the most "Gravity" (assists/hockey assists from the paint) reveals the true offensive engines.
**What:** Correlate Paint Touch events with subsequent assists and secondary assists to calculate a "Rim Gravity Index."
**Acceptance Criteria:**
- [ ] "Rim Gravity" metric in GameStats: (Assists from Paint / Total Paint Touches).
- [ ] Visualization showing "Gravity Paths" (Paint touch to corner 3 assist).
- [ ] Identification of the team's "Primary Paint Collapser."

## [Predictive Rotation 'Red-Line' Fatigue Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** A player's performance often "cliffs" before they look visibly tired. Predictive modeling using cumulative game minutes and intensity (stats per minute) can identify the "Red-Line" before it costs points.
**What:** A fatigue advisor that uses stint history and live performance metrics to predict when a player's efficiency is likely to drop.
**Acceptance Criteria:**
- [ ] "Efficiency Red-Line" indicator on the bench/lineup cards.
- [ ] Predictive "Minutes Remaining" before recommended sub based on cumulative game load.
- [ ] Alert: "Player X is approaching Red-Line; Efficiency expected to drop by 15%."

## [Opponent Tendency 'Scouting Badge' Overlay]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Scouting reports are useless if the coach has to look away from the court to remember them. Surfacing tendencies (e.g., "Drives Left 80%") directly on the live tracking card keeps the game plan in focus.
**What:** Integrate persistent scouting data into the live GameMode opponent cards as high-visibility "Tendency Badges."
**Acceptance Criteria:**
- [ ] "Tendency Badges" (e.g., "LEFTY", "STRETCH 4", "SHOOTER") on opponent tracking cards.
- [ ] Dynamic badge updates if the opponent deviates from season tendencies during the live game.
- [ ] One-tap access to the full scouting report for that specific player from the GameMode.

## [Live 'Process-over-Result' Confidence HUD]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Teams often abandon a winning offensive "Process" because shots aren't falling (Bad Luck). Surfacing the "Expected Points" vs "Actual Points" delta in real-time allows coaches to keep players focused on high-quality looks even during a shooting slump.
**What:** A live "Confidence Gauge" in GameMode that visualizes the totalXPts vs totalPoints delta.
**Acceptance Criteria:**
- [ ] A high-visibility "Confidence Gauge" that glows GREEN when xPTS > Actual Points (Good Process, Bad Luck).
- [ ] Real-time "Process Delta" (+/- xPTS) displayed in the Tactical HUD.
- [ ] Alert: "Trust the Process" triggered during a 0-for-5 slump on "OPEN" shots.

## [Opponent 'Tactical Shift' Detector]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponent coaches often pivot schemes (e.g., Man to Zone) or focal points (e.g., PnR to Post) mid-quarter. Detecting these shifts early allows for preemptive counter-adjustments before a run starts.
**What:** An automated detection engine that monitors opponent StatEvent patterns for significant deviations from their game-to-date baseline.
**Acceptance Criteria:**
- [ ] Alert: "Opponent Shift: 3 consecutive Zone possessions detected."
- [ ] Alert: "Opponent Shift: increased focus on RIM ATTACKS (+30% vs game average)."
- [ ] Visual indicator on the opponent card when their "Play-Type Frequency" shifts by >15%.

## [Live 'Unit Rhythm' Stagnation Alert]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Lineups often "Stagnate" (efficiency cliffs) before the coach notices. Identifying "Rhythm Decay" within a single stint—rather than relying on overall game Net Rating—drives faster substitution decisions.
**What:** A stint-level efficiency monitor that tracks the "Decay Rate" of PPP for the active unit.
**Acceptance Criteria:**
- [ ] "Rhythm Meter" on the lineup HUD showing the stint's PPP trend (Rolling 3-possession average).
- [ ] Alert: "Unit Stagnation: PPP has dropped by 0.4 in the last 4 minutes."
- [ ] Suggested "Spark Plug" sub from the bench when stagnation is detected.

## [Automated 'Rim Protection' (Verticality) ROI]
**Priority:** HIGH
**Type:** Analytics / Causal Accountability
**Why:** Elite rim protection is often about "forcing a miss" through verticality rather than a block. Quantifying the points saved by defenders who don't record a counting stat reveals the team's true defensive anchors.
**What:** A "Verticality" metric derived from StatEvent data where a primaryDefenderId is linked to an opponent rim MISS without a BLOCK or STEAL.
**Acceptance Criteria:**
- [ ] "Verticality Score" in the accountability HUD (Points Saved per Rim Contest).
- [ ] Leaderboard for "Rim Deterrence" identifying players with the lowest Opponent Rim % when on-court.
- [ ] Attribution: Automatically link on-court "Defensive Anchor" to opponent rim misses.

## [Live 'Off-Ball' Defensive Accountability Tracker]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Most points allowed aren't "blow-bys" but "late tags" or "missed rotations" off-ball. Isolating off-ball failures from primary defender failure is the key to fixing a leaky defense.
**What:** Expand the breakdownReason system to include "Off-Ball" categories (e.g., "Late Tag", "No Help") and attribute them to a secondaryDefenderId.
**Acceptance Criteria:**
- [ ] Addition of "Secondary Defender" selection to the Opponent Score/Breakdown workflow.
- [ ] "Off-Ball Failure" leaderboard in GameStats.
- [ ] Correlation matrix: identifying if specific pairs (Guard/Big) have a high "Missed Tag" rate on PnR.

## [Live 'Synergy Seam' Exposure Alert]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Defensive failures are often caused by specific 2-player pairings missing rotations. Identifying "Leaky Duos" in real-time allows coaches to make surgical substitution adjustments before a defensive collapse.
**What:** A live indicator in the Lineup HUD that flags when the current on-court unit contains a 2-player pairing with a high historical `breakdownReason` correlation.
**Acceptance Criteria:**
- [ ] Real-time "Synergy Warning" badge on the Lineup HUD.
- [ ] Tooltip showing the specific pairing and their most frequent breakdown type (e.g., "Late Tag on PnR").
- [ ] Correlation with live game events to see if the "Seam" is being exploited in the current stint.

## [Predictive 'Bonus-by-Minute' Auditor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Knowing the team is in the bonus is good; knowing they *will be* in the bonus in 2 minutes based on current whistle flow is a strategic advantage for play-calling.
**What:** An auditor that uses period-to-date whistle flow to predict the exact game-clock time the opponent will enter the bonus.
**Acceptance Criteria:**
- [ ] "Expected Bonus Entry" clock time displayed in the Scoreboard.
- [ ] Tactical directive: "Aggressive Mode" suggested when bonus entry is predicted within 120 seconds.
- [ ] Alert: "Free Throw Opportunity High" based on opponent foul frequency.

## [Momentum 'Pivot Play' HUD Confirmation]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Identifying a run is easy; identifying the *exact play* (the pivot) that allowed the run to start is coaching. Coaches need to "Confirm" the pivot to focus the team's attention during timeouts.
**What:** When a run/drought alert is triggered, the HUD should isolate the "Pivot Play"—the specific turnover or missed box-out that preceded the run.
**Acceptance Criteria:**
- [ ] One-tap "Review Pivot" button on the Run/Drought Alert.
- [ ] Isolation of the `StatEvent` deemed the "Pivot" (the last team success before the opponent run).
- [ ] High-visibility "Pivot Summary" in the Halftime Report.

## [Live 'Expected Lead' (xLead) Gauge]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Coaches often overreact to a deficit that is actually just "Bad Luck" (cold shooting on good looks). The xLead gauge keeps the coaching staff calm by showing the score based on Shot Quality (xPTS).
**What:** A live secondary score display (e.g., "xScore: 42-38") that visualizes the game's progress based on expected value rather than actual makes.
**Acceptance Criteria:**
- [ ] "Expected Score" (xScore) display next to the actual score in GameMode.
- [ ] "Luck Delta" indicator: Color-coded to show if the team is overperforming or underperforming their process.
- [ ] Alert: "Stay the Course" triggered if xScore lead is > 5 while actual score is trailing.

## [Opponent 'Tactical Identity' Deviation Alert]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponents often "break character" under pressure or after a timeout. Detecting when they stop running their primary sets or shift their shot profile allows for immediate counter-adjustments.
**What:** An engine that monitors live opponent play-type and location frequency and compares it to their season-long "Tactical Identity."
**Acceptance Criteria:**
- [ ] Alert: "Opponent Deviation: Increased Mid-Range frequency (+25% vs Season)."
- [ ] Alert: "Opponent Deviation: Abandoned PnR sets in the last 4 possessions."
- [ ] Visual indicator on the opponent card when they are playing "Off-Identity."
