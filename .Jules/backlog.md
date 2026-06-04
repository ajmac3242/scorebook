# CourtSight Backlog

## [ ] [Live 'Offensive-Tempo' (Possession-Length) Optimization Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Teams often fall into a "Tempo Trap"—playing too fast when they need to bleed the clock or too slow when they need to increase possession volume. Optimizing the average possession length based on win probability and lead delta ensures mathematical dominance.
**What:** A live "Tempo Gauge" that calculates the optimal target possession length (in seconds) for the current game state and alerts the coach if the unit is playing "Out of Tempo."
**Acceptance Criteria:**
- [ ] "Target Tempo" (e.g., 18s) displayed in the Offensive HUD.
- [ ] Visual alert: "Tempo Mismatch" if the last 3 possessions averaged +/- 4s from the target.
- [ ] Correlation of "Tempo Adherence" to lead stability in post-game reports.

## [ ] [Predictive 'Personnel-Collision' Fatigue Warning]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Fatigue isn't just about minutes; it's about "Collisions"—the physical toll of screens, box-outs, and rim contests. Tracking "Collision Volume" identifies players who are "gassing out" physically before their stint timer hits the red-line.
**What:** An expansion of the StatEvent system that tracks "Collision Events" (Screens Set, Box-outs, Contests) and calculates a "Collision-Adjusted Fatigue" score.
**Acceptance Criteria:**
- [ ] "Collision Meter" on player cards showing cumulative physical impact.
- [ ] Alert: "Physical Exhaustion Risk" when a player's collision-to-minute ratio exceeds the team's 90th percentile.
- [ ] Suggested "Enforcer Sub" to relieve a high-collision star.

## [ ] [Live 'Referee-Whistle Shift' Detector]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Referee crews often shift their "Tightness" (FPM) mid-game, often in response to the score or home/away momentum. Detecting a "Whistle Shift" allows the coach to adjust defensive aggression before a flurry of fouls occurs.
**What:** An engine that monitors rolling 4-minute whistle frequency and alerts if there is a statistically significant shift in the FPM (Fouls Per Minute) baseline.
**Acceptance Criteria:**
- [ ] "Whistle Flow" trend line in the Referee HUD.
- [ ] Alert: "Whistle Tightening Detected" if FPM increases by > 0.4 in the last window.
- [ ] Suggested "Soft Defense" directive to prevent foul-trouble during a tight whistle window.

## [ ] [Automated 'Zone-Diagnostic' Strategy Tool]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** When an opponent goes Zone, offenses often "Freeze." A diagnostic tool identifies the "Zone Type" and prescribes the specific "Zone-Breaker" sets from the playbook immediately.
**What:** An automated detection layer that identifies opponent defensive spacing (2-3, 3-2, 1-3-1) and triggers the "Zone-Breaker" directive HUD.
**Acceptance Criteria:**
- [ ] Alert: "Zone Detected: [Type]" after 2 consecutive non-man possessions.
- [ ] Automatic suggestion of the top 2 "Zone-Breaker" plays from the team's historical efficiency.
- [ ] "Zone ROI" tracking the efficiency of the offensive response.

## [ ] [Predictive 'Game-Winner' Decision Matrix]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** In a "Last Shot" scenario, the coach has < 10 seconds to choose between "Baseline Out of Bounds (BLOB)", "Isolation", or "PnR". A decision matrix ranks these options based on individual "Clutch Success Rate" and opponent "Weak-Link" data.
**What:** A specialized "Dagger HUD" that activates in the final 30 seconds of a tie or 1-possession game, providing a ranked list of the 3 most statistically probable game-winning actions.
**Acceptance Criteria:**
- [ ] "Dagger Matrix" HUD element showing ranked play-type options.
- [ ] "Clutch-ROI" score for the suggested primary option.
- [ ] One-tap "Command Dispatch" to the bench for the chosen play.

## [ ] [Live 'Handle-Security' Entropy Warning]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Excessive dribbling and "sticky" handles increase the probability of turnovers and offensive stagnation. Detecting high-entropy ball-handling in real-time allows coaches to call for a "reset" or "move the ball" before a turnover occurs.
**What:** A monitor that tracks the "Dribble-to-Pass" ratio and "Touch Duration" of the primary ball-handler, flagging possessions where entropy exceeds the team's efficiency threshold.
**Acceptance Criteria:**
- [ ] "Entropy Alert" on the player card when touch duration exceeds 6 seconds without a paint touch or pass.
- [ ] "Handle-Security" index (0-100) displayed in the Offensive HUD.
- [ ] Correlation of "High Entropy" possessions to turnover rate in post-game reports.

## [ ] [Live 'Defensive-Communication' Verbal Engagement Log]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** A "quiet" defense is a "leaky" defense. Tracking verbal engagement (Talk, Switches, Help calls) identifies which players are leading the defensive shell and where communication seams are breaking.
**What:** A specialized tracking layer that allows assistants to log "Communication Events" (e.g., "Screen Call", "Switch Call", "Early Help Call") to quantify the vocal leadership of the unit.
**Acceptance Criteria:**
- [ ] "Vocal Engagement" buttons added to the Defensive HUD.
- [ ] "Talk Index" leaderboard identifying the most vocal defensive anchors.
- [ ] Correlation of "Vocal Frequency" to Opponent PPS (Points Per Shot) on secondary actions.

## [ ] [Predictive 'Foul-Target' (Opponent-Clutch) Advisor]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** In clutch situations, knowing which opponent player is most likely to "crack" or has the lowest FT% under pressure determines who we should "target" for fouls or aggressive defensive pressure.
**What:** An intelligence layer that identifies the "High-Risk Foul Target" on the opponent team based on live FT% and cumulative turnover rate in clutch windows.
**Acceptance Criteria:**
- [ ] "Foul Target" glow on the opponent card during Clutch Mode (< 2 mins, close game).
- [ ] Tooltip showing the target's Clutch FT% and "Panic Rate" (TOs per Clutch Possession).
- [ ] Suggested "Target Attack" play to force a foul on the identified weak link.

## [ ] [Season-Wide 'Coaching-Decision' ROI Dashboard]
**Priority:** HIGH
**Type:** Feature / Longitudinal Analytics
**Why:** Coaches need to audit their own performance. Tracking the ROI of substitutions, timeouts, and tactical pivots over a season reveals the "Decision Strengths" and "Fatigue Patterns" of the coaching staff.
**What:** A longitudinal dashboard that aggregates the "Post-Decision ROI" (PPP delta following a coach intervention) across all games in the season.
**Acceptance Criteria:**
- [ ] "Coaching ROI" tab in the Program Dashboard.
- [ ] Trend lines for "Timeout Effectiveness" and "Sub-Synergy Success Rate."
- [ ] "Decision Fatigue" heat-map showing ROI relative to game-clock and season-load.

## [ ] [Automated 'Post-Entry' Stagnation Monitor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Offenses often "die" after a post-entry if the ball doesn't move within 2 seconds. Monitoring "Post-Stagnation" identifies when the team is reverting to low-value post-isolation instead of synergistic flow.
**What:** A monitor that triggers an alert if a "Post Touch" does not result in a shot, pass, or kick-out within a specific "Flow Window" (2.5 seconds).
**Acceptance Criteria:**
- [ ] "Post-Flow" timer active during every recorded Post Touch.
- [ ] Alert: "Post Stagnation Detected" if the flow window closes without an action.
- [ ] Correlation of "Post-Entry Flow" to overall PPP in post-game analytics.

## [ ] [Live 'Bench-Readiness' Warm-up Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Star players and key role players often enter the game "cold" after long stretches on the bench, leading to immediate unforced turnovers or poor shooting. Managing the "Warm-up window" ensures peak performance from the first second of a stint.
**What:** A predictive advisor that calculates the "Readiness State" of bench players and suggests when a player should begin "warming up" (mental or physical) based on their expected re-entry time.
**Acceptance Criteria:**
- [ ] "Readiness Gauge" (0-100) on all bench player cards.
- [ ] Visual alert: "Warm-up Suggested" for star players 2 minutes before their predicted rotation node.
- [ ] Correlation of "Readiness" to first-minute stint PPP in post-game reports.

## [ ] [Opponent-Timeout' Prediction Engine]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Anticipating an opponent timeout allows the head coach to pre-draw the next play and set the defensive scheme before the whistle, gaining a critical 30-second preparation advantage.
**What:** An engine that monitors opponent momentum, lead evaporation, and cumulative opponent runs to predict the probability of an opponent calling a timeout in the next 2 possessions.
**Acceptance Criteria:**
- [ ] "Timeout Probability" (%) displayed on the Opponent Scouting Card.
- [ ] Alert: "Expected Opponent Timeout" when probability exceeds 75%.
- [ ] Pre-emptive "ATO Strategy" prompt to allow the coach to pre-select the next offensive set.

## [ ] [Strategic-Risk' ROI Gauge]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Every tactical adjustment (e.g., "Full Court Press" or "Double Team") has an "Inverse Risk"—the potential for a high-value breakdown. Quantifying this risk ensures coaches don't "over-gamble" the lead.
**What:** A live "Risk/Reward" gauge that calculates the mathematical trade-off of active tactical directives based on historical team execution and opponent counter-efficiency.
**Acceptance Criteria:**
- [ ] "Strategic Risk" index (0-100) displayed next to active Tactical Directives.
- [ ] Alert: "High-Risk Gamble" if a directive's projected Points-Allowed-Per-Possession (PAPP) delta is > 0.4.
- [ ] "Risk ROI" summary showing the net point gain/loss from "Gamble" possessions.

## [ ] [Defensive-Tag' Accuracy Tracker]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** The "Help-Side Tag" is the heart of a defensive shell. Tracking the accuracy and timing of these tags reveals who is truly anchoring the defense and who is "leaking" points through hesitation.
**What:** A specialized tracking layer in the Defensive Breakdown flow that isolates the "Tag" event and attributes accuracy (e.g., "Clean Tag", "Late Tag", "Missed Tag").
**Acceptance Criteria:**
- [ ] "Tag Accuracy" selector added to the Defensive Breakdown/Score recording flow.
- [ ] "Shell Anchor" leaderboard identifying players with the highest % of "Clean Tags."
- [ ] Correlation of "Tag Latency" to Opponent Rim eFG%.

## [ ] [Playbook-Drift' Detector]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Teams often "Drift" away from their called sets during runs, reverting to low-value isolation play. Detecting this drift in real-time allows coaches to re-establish discipline before the lead evaporates.
**What:** A monitor that compares the "Intended Play" (Directive) vs. the "Actual Execution" (StatEvent chain) to identify when the team has abandoned the game plan.
**Acceptance Criteria:**
- [ ] "Playbook Adherence" grade (A-F) displayed in the Tactical HUD.
- [ ] Alert: "Tactical Drift Detected" when 3 consecutive possessions end in "Scramble" actions despite a "Set Play" directive.
- [ ] Correlation of "Adherence Grade" to PPP over 5-minute game windows.

## [ ] [Live 'Offensive-Spacing' Congestion HUD]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Modern spacing is the key to offensive efficiency. Detects spacing conflicts and "clogged" lanes in real-time to prevent offensive stagnation and high-turnover "scramble" possessions.
**What:** A visual overlay in the GameMode court view that identifies when 3+ offensive players are in the same quadrant and calculates a live "Spacing Grade" based on player coordinates.
**Acceptance Criteria:**
- [ ] Visual "Congestion Alert" on the court when offensive spacing violates quadrant rules.
- [ ] "Spacing Grade" (0-100) displayed in the Offensive KPI HUD.
- [ ] Correlation of "Spacing Grade" to PPP for the last 5 possessions.

## [ ] [Predictive 'Help-Latency' Resilience Alert]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** A defense breaks when "Help" is slow. Tracking the latency of the shell's response to rim pressure identifies defensive decay (fatigue or mental lapse) before the opponent starts a scoring run.
**What:** An analytical monitor that measures the time delta between an opponent "Paint Entry" and the corresponding defensive "Help Tag" or "Contest," alerting if the latency exceeds the team's historical average.
**Acceptance Criteria:**
- [ ] "Help Latency" gauge in the Tactical Identity HUD (seconds).
- [ ] Visual alert: "Shell Decay Detected" when help latency increases by > 0.5s in a single stint.
- [ ] Suggested "Rim Protector Sub" if latency remains high for 3 consecutive possessions.

## [ ] [Live 'Bench-Rhythm' Synergy Optimizer]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** "Bridge Lineups" (bench units) often fail because they lack synergistic "Rhythm" with the remaining stars. Optimizing the sub-pairing based on pairwise Net Rating maximizes the lead during star rest windows.
**What:** An intelligence layer in the QuickSubDialog that ranks bench players based on their historical synergy (Net Rating) with the players currently staying on the court.
**Acceptance Criteria:**
- [ ] "Synergy Rank" (1-3) displayed on bench player cards during the substitution flow.
- [ ] Pairwise Net Rating tooltips for proposed 5-man units.
- [ ] Warning: "Non-Synergistic Unit" if the proposed lineup's historical shared Net Rating is < -10.

## [ ] [Automated 'Lead-Stability' Strategy Prescriber]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** Protecting a lead in the 4th quarter requires a shift from "Aggression" to "Stability." This prescriber identifies when to slow the pace and prioritize low-entropy actions to secure the win.
**What:** A strategic advisor that activates in the 4th quarter when the team is leading, prescribing specific "Stability Directives" (e.g., "NO FAST BREAKS," "USE 20s CLOCK") based on win probability.
**Acceptance Criteria:**
- [ ] "Stability Mode" sidebar widget that activates based on score-delta and time.
- [ ] Dynamic "Stability Directives" that shift as the win probability crosses 80%.
- [ ] "Lead Security" index showing the team's adherence to stability rules.

## [ ] [Opponent 'Frustration-Index' Tracker]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Teams are most vulnerable when they are frustrated. Tracking the opponent's "Emotional Fracturing" (Turnovers, Missed FTs, Technicals) identifies the "Dagger Window" where a tactical press can break their will.
**What:** A momentum engine that aggregates negative opponent events into a "Frustration Index" and suggests a high-pressure "Dagger Scheme" (e.g., Full Court Press) when the index peaks.
**Acceptance Criteria:**
- [ ] "Frustration Gauge" (0-100) on the Opponent Scouting card.
- [ ] Alert: "Dagger Window Open" when opponent frustration exceeds 80.
- [ ] Post-game "Momentum Dagger" summary showing the ROI of tactical aggression during high-frustration windows.

## [ ] [Live 'Self-Inflicted' Momentum-Kill Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Most scoring runs are preceded by a specific "Self-Inflicted" error (e.g., an unforced turnover or a "hero-ball" shot) that breaks the team's psychological rhythm. Identifying these "Momentum Kills" allows coaches to intervene immediately before the run snowballs.
**What:** An engine that identifies the specific `StatEvent` immediately preceding an opponent run > 6-0 and flags it as a "Momentum Kill," categorizing the behavior (e.g., "Poor Shot Selection" or "Defensive Relaxation").
**Acceptance Criteria:**
- [ ] Visual alert: "Momentum Kill Detected" immediately following a high-risk process failure.
- [ ] Correlation index showing which "Kill Types" most frequently lead to opponent momentum shifts for the current game.
- [ ] Post-game "Momentum-Kill" summary identifying the 3 most costly self-inflicted errors.

## [ ] [Live 'Switch-Mismatch' Exposure HUD]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Defensive switches are necessary but often create "Silent Mismatches" that the opponent exploits before the coach can react. Tracking the PPP of specific "Mismatched" pairings (e.g., Guard vs. Big) identifies defensive vulnerabilities in real-time.
**What:** A live HUD element that tracks the outcome of possessions where a switch resulted in a positional mismatch and calculates the opponent's PPP on those specific sequences.
**Acceptance Criteria:**
- [ ] "Mismatch Gauge" in the Tactical Identity HUD showing the efficiency of opponent attacks against switched mismatches.
- [ ] Alert: "Mismatch Exploited" if an opponent scores twice in a row against the same positional mismatch.
- [ ] Suggested "Scheme Adjustment" (e.g., "Scram Switch" or "Blitz") to neutralize the mismatch.

## [ ] [Predictive 'Recovery-Node' Burst Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Elite defenders need "Bursts" of intensity. Identifying the "Recovery Node"—the specific window of rest (game clock time) required for a player to regain their high-intensity defensive effectiveness—optimizes sub timing.
**What:** A predictive advisor in the Lineup HUD that calculates the "Defensive Burst" capacity of bench players and suggests the optimal re-entry time to maximize rim deterrence.
**Acceptance Criteria:**
- [ ] "Burst Meter" on bench player cards showing % recovery of defensive intensity.
- [ ] Suggested "Defensive Sub" alert when an on-court anchor's deterrence drops while a bench anchor reaches 90% recovery.
- [ ] Correlation of "Rest Duration" to "Post-Entry Deterrence ROI" for each rostered player.

## [ ] [Live 'Glass-Mastery' (Causal Rebounding) Auditor]
**Priority:** HIGH
**Type:** Analytics / Feature
**Why:** Rebounding isn't just about the board; it's about the "Causal Process" (e.g., "Missed Box-out" vs. "Long Rebound"). Identifying *why* we are losing the glass allows for surgical coaching fixes beyond just telling players to "rebound harder."
**What:** An expansion of the Rebound StatEvent that requires a "Causal Tag" for opponent OREBs (e.g., "Missed Box-out", "Unlucky Bounce", "Shell Collapse") and aggregates the data in real-time.
**Acceptance Criteria:**
- [ ] "Rebound Anatomy" HUD showing the primary cause of opponent second-chance points.
- [ ] "Box-out Accountability" index identifying players with the highest frequency of missed assignments.
- [ ] Alert: "Glass Integrity Decay" when 2+ consecutive opponent scores are the result of "Missed Box-outs."

## [ ] [Live 'Decision-Window' Leverage Gauge]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** Every game has "Leverage Windows"—critical 2-minute stretches where a lead can be blown or secured. Identifying the "Leverage" of the current game state helps coaches prioritize aggression vs. stability.
**What:** A live "Leverage Gauge" in the Scoreboard HUD that calculates the "Game Importance" of the current possession based on time, score, and momentum.
**Acceptance Criteria:**
- [ ] "High Leverage" glow on the Scoreboard when the leverage index exceeds 80/100.
- [ ] Automatic prioritization of HALT alerts during High-Leverage windows.
- [ ] "Leverage ROI" summary showing team performance during the game's 5 highest-leverage windows.

## [ ] [Live 'Coaching Decision-Fatigue' Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Coaches make hundreds of decisions under pressure; identifying when "Decision Fatigue" leads to sub-optimal tactical choices (e.g., missed sub windows) allows for systematic improvement in game-management.
**What:** A monitor that tracks "Decision Frequency" and "Outcome ROI" over the course of a game, flagging periods where the coach's tactical adjustment success rate (PPP delta) begins to decline relative to their fresh-state average.
**Acceptance Criteria:**
- [ ] "Decision Fatigue" index (0-100) displayed in the Tactical Sidebar.
- [ ] Visual alert: "Decision Stagnation Detected" when tactical ROI drops by >20% in a single half.
- [ ] Post-game summary identifying "Critical Decision Windows" and the coach's efficiency in those moments.

## [ ] [Automated 'Clutch-Time' Strategic Decision Tree]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** In the final 2 minutes of a close game, the mathematical complexity of "Foul vs. Play-Out" or "2-for-1" is often too high for stressed intuition. A decision tree provides the objective optimal path.
**What:** A situational "Decision Tree" HUD that activates in Clutch Mode, providing a step-by-step tactical path based on score, time, and team-specific FT/TO rates.
**Acceptance Criteria:**
- [ ] Live "Strategic Path" display: e.g., "PATH A: Foul Now (34% Win Prob) | PATH B: Play for Stop (28% Win Prob)."
- [ ] Dynamic updates as every second elapses or every stat is recorded.
- [ ] One-tap "Command Dispatch" to relay the chosen path to the bench.

## [ ] [Live 'Unit-Archetype' Redundancy Alert]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Units often fail because they are "Redundant"—too many players with the same archetype (e.g., three 'Rim-Runners' with no 'Space-Creator'), leading to offensive stagnation.
**What:** An intelligence layer in the Lineup HUD that analyzes the archetypal composition of the on-court unit and flags "Synergy Gaps" or "Archetypal Overlap."
**Acceptance Criteria:**
- [ ] "Synergy Composition" gauge showing the balance of Rim Pressure, Spacing, and Playmaking.
- [ ] Alert: "Offensive Redundancy: 3+ Rim-Runners on floor; Space-Rating < 40."
- [ ] Recommended "Archetype Pivot" sub to balance the unit's synergy.

## [ ] [Live 'Opponent-Counter' Response Efficiency Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Winning is about the "Counter-Move." This auditor tracks how efficiently the opponent responds to our tactical adjustments (e.g., if we go Zone, how quickly do they solve it?).
**What:** A tracking layer that bookmarks the first 3 possessions following a change in our active defensive scheme and calculates the opponent's "Solution Speed" (PPP ROI).
**Acceptance Criteria:**
- [ ] "Counter ROI" display showing opponent PPP before and after our tactical pivot.
- [ ] Alert: "Adjustment Solved" if opponent PPP on the last 3 possessions against a new scheme exceeds 1.1.
- [ ] Suggested "Secondary Pivot" once an adjustment has been neutralized.

## [ ] [Predictive 'Next-Play' Momentum Catalyst]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Momentum isn't just about what happened; it's about what happens *next*. Identifying the "Catalyst Play"—the specific action most likely to break an opponent run—empowers the coach to call the right play.
**What:** A momentum engine that analyzes historical team success against the current opponent defensive state and suggests the "Highest Probability Catalyst" (e.g., "Set Play: Hammer" or "Action: Paint Touch").
**Acceptance Criteria:**
- [ ] "Momentum Catalyst" HUD active during opponent runs > 6-0.
- [ ] Suggested "Catalyst Action" based on live efficiency outliers.
- [ ] "Catalyst ROI" tracking the success rate of recommended momentum-breaking plays.

## [ ] [Decision-Latency ROI Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Tactical alerts (e.g., "Sub Star") are only effective if acted upon. Quantifying the "Cost of Hesitation" (points allowed between alert and action) creates a feedback loop for coaching staff to improve decision speed.
**What:** A specialized auditor that tracks the time delta between a system-generated Tactical Alert (HALT) and the corresponding coach action, calculating the opponent's PPP during that specific window.
**Acceptance Criteria:**
- [ ] "Latency ROI" display in the Tactical Sidebar showing the points-cost of active alerts.
- [ ] Post-game "Decision Speed" summary comparing average latency to winning/losing stints.
- [ ] Visual highlight: "Critical Delay" if an alert persists for > 60 seconds of game clock.

## [ ] [Automated 'Opponent-Counter' Prescriber]
**Priority:** HIGH
**Type:** Feature / Predictive Intelligence
**Why:** Identifying a threat is step one; knowing the *counter* is winning. This prescriber automatically suggests the optimal 5-man unit from our roster to neutralize the opponent's currently ranked top archetypal threat.
**What:** An extension of the Archetypal Threat Ranker that cross-references opponent threat profiles with our unit-level defensive history (Scheme x Personnel).
**Acceptance Criteria:**
- [ ] "Counter Suggestion" HUD showing the 5-man unit with the highest historical stop % against the active opponent archetype.
- [ ] One-tap "Counter Sub" button to trigger the QuickSub flow for the recommended unit.
- [ ] "Counter ROI" readout showing the efficiency of the prescriber's suggestions.

## [ ] [Live 'Tactical-Ghosting' (Engagement) Tracker]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Many defensive failures are "Ghosts"—mental lapses (e.g., missed talk, late stunt) that don't result in a score but degrade shell integrity. Tracking these "silent" regressions identifies engagement decay before the opponent starts scoring.
**What:** A tracking layer that allows assistants to log "Engagement Failures" (Ghost Stats) that don't have a direct outcome (Make/Miss) but represent tactical drift.
**Acceptance Criteria:**
- [ ] "Ghost Stat" buttons added to the Tactical HUD (e.g., "Missed Talk", "Lazy Closeout").
- [ ] "Engagement Index" (0-100) that decays as ghost failures accumulate.
- [ ] Alert: "Tactical Ghosting Detected" when engagement drops below 60, predicting an imminent defensive collapse.

## [ ] [Live 'Unit-Cohesion' (Pace-Sync) Monitor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Transition "leaks" often occur because one or two players are "out of sync" with the team's pace (e.g., hanging back on a break). Monitoring unit cohesion identifies which player is breaking the team's flow.
**What:** A monitor that calculates individual "Pace-Sync" by comparing a player's arrival time at the rim (Offense/Defense) against the team average for that possession.
**Acceptance Criteria:**
- [ ] "Cohesion Gauge" showing the sync-level of the active 5-man unit.
- [ ] Identification of the "Pace Anchor" (slowest retreat/advance player) for the last 3 possessions.
- [ ] Alert: "Transition Desync" when unit cohesion falls below 70%.

## [ ] [Predictive 'Game-Flow' Entropy Alert]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Basketball games often enter a "Scrambled" state (high entropy)—rapid turnovers, poor shots, and chaotic transition. Entropy alerts trigger the coach to call a timeout or a "Stabilizer" play to regain control.
**What:** An entropy engine that monitors the "Chaos Factor" (Turnovers + Low-xPTS Shots + Scramble Possessions) over a rolling 2-minute window.
**Acceptance Criteria:**
- [ ] "Entropy Alert" in the Tactical Sidebar when chaos exceeds the team's "Control Threshold."
- [ ] Suggested "Stabilizer" action: e.g., "COMMAND: SLOW DOWN; Set Play Required."
- [ ] "Control ROI" metric: Measuring the reduction in entropy following a stabilizer directive.

## [ ] [Live 'Archetypal-Intelligence' Threat Ranker]
**Priority:** HIGH
**Type:** Feature / Predictive Intelligence
**Why:** Opponent threats often follow recognizable archetypes (e.g., "The Rim Runner," "The Kick-out Specialist"). Ranking these by their specific efficiency against our current on-court unit allows for surgical defensive adjustments.
**What:** An intelligence layer that assigns an "Archetype" to active opponent threats and ranks them by their projected PPP against our current personnel.
**Acceptance Criteria:**
- [ ] "Threat Ranker" HUD element in GameMode showing the top 3 opponent archetypal threats.
- [ ] Dynamic ranking that shifts as our lineup or the opponent's personnel changes.
- [ ] One-tap "Defensive Counter" suggestion for each ranked threat (e.g., "Front the Post").

## [ ] [Live 'Unit-Resilience' Decay Monitor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Lineup efficiency doesn't just "cliff"—it decays. Measuring the "Resilience" (ability to sustain efficiency under pressure/fatigue) identifies the exact moment a unit is "playing in sand" before the run happens.
**What:** A decay monitor in the Lineup HUD that visualizes the "Resilience Curve" of the current 5-man unit based on their rolling 3-possession Net Rating vs. their season average.
**Acceptance Criteria:**
- [ ] "Resilience Index" (0-100) displayed for the active lineup.
- [ ] Visual alert: "Efficiency Decay Detected" when the index drops by >20 points in a single stint.
- [ ] Predicted "Performance Cliff" timer showing estimated possessions remaining before a recommended sub.

## [ ] [Live 'Causal-Cluster' Breakdown Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Defensive breakdowns often happen in clusters (e.g., 3 straight missed rotations). Identifying the "Causal Cluster" (the common factor across these breakdowns) allows the coach to fix the root cause, not just the symptoms.
**What:** An auditor that groups recent `breakdownReason` events by player, scheme, or action type to identify high-frequency clusters.
**Acceptance Criteria:**
- [ ] "Cluster Alert" in the Tactical Sidebar: e.g., "3 Missed Rotations attributed to P&R Scheme."
- [ ] One-tap "Cluster Breakdown" view showing the common personnel/scheme factor.
- [ ] Suggested "Scheme Pivot" to neutralize the detected causal cluster.

## [ ] [Live 'Synergy-Flow' Decision ROI Gauge]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Points are the result of a "Synergy Chain" (e.g., Drive -> Draw Help -> Kick -> Extra Pass). Measuring the ROI of each decision in the chain proves the "System" is working even if the final shot is a miss.
**What:** A visualization in GameMode that tracks the "Decision Chain" of each possession and calculates the cumulative xPTS generated by each synergistic link.
**Acceptance Criteria:**
- [ ] "Synergy Flow" HUD showing the xPTS impact of the last 3 decisions.
- [ ] "Flow Rating" (A-F) based on the team's adherence to "Extra Pass" and "Paint Touch" synergy rules.
- [ ] Alert: "Flow Stagnation" when the synergy chain is broken by an "Iso-Stick" possession.

## [ ] [Automated 'Game-Script' Pivot Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Every game has a "Script"—the overarching tactical flow. When the script breaks (e.g., a 10-point lead evaporates), coaches often struggle to find the "New Script." This advisor prescribes the strategic pivot.
**What:** A high-level strategic advisor that monitors the game's "Tactical Script" (Pace, Efficiency, Lead) and suggests a "Master Pivot" when the script deviates significantly from the pre-game plan.
**Acceptance Criteria:**
- [ ] "Script Advisor" in the Tactical Sidebar that monitors Game State vs. Game Plan.
- [ ] Alert: "Script Breakdown: Pace exceeds goal by +15; RECOMMEND: Slow Down Offensive Flow."
- [ ] One-tap "Master Directive" that summarizes the 3 necessary tactical shifts to regain control.

## [ ] [Live 'Strategic-Command' Priority Synthesizer]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** In high-pressure moments, coaches are often overwhelmed by multiple data alerts (e.g., "Foul Trouble," "Momentum Shift," "Efficiency Drop"). A synthesizer ranks these threats by their mathematical impact on win probability, ensuring the coach addresses the most critical fire first.
**What:** A top-level "Command HUD" in GameMode that aggregates all active HALT and identity alerts, assigning a "Priority Score" and highlighting the single most impactful tactical pivot.
**Acceptance Criteria:**
- [ ] "Priority Synthesizer" widget at the top of the Tactical Sidebar.
- [ ] Ranking logic that weights "Clutch Time" and "Score Delta" into alert severity.
- [ ] One-tap "Master Directive" that summarizes the top 3 urgent actions.

## [ ] [Opponent 'Post-Huddle' (Counter-Tactical) Efficiency Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Opponent adjustments often happen during timeouts. Tracking the opponent's PPP on the 3 possessions immediately following *their* timeout reveals if their coach successfully solved our current scheme.
**What:** An auditor that bookmarks the start of opponent possessions following an opponent timeout and compares their post-huddle efficiency to their game average.
**Acceptance Criteria:**
- [ ] Automated "Post-Huddle Tracking" triggered by opponent timeout events.
- [ ] "Counter-Tactical ROI" metric showing the opponent's PPP increase/decrease after huddles.
- [ ] Alert: "Opponent Adjustment Detected" if their post-huddle PPP exceeds game average by > 0.3.

## [ ] [Live 'Rim-Read' (Decision ROI) Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Points at the rim are the result of a "Read"—the decision to drive, pass, or kick. Quantifying the ROI of these rim-level decisions proves if the ball-handler is making the "Right Read" regardless of the physical finish.
**What:** An expansion of the Paint Touch system that requires a "Read Type" (Score Attempt, Pass to Cutter, Kick to Perimeter) and calculates the expected value (xPTS) of that decision.
**Acceptance Criteria:**
- [ ] "Read Selection" buttons added to the Paint Touch recording flow.
- [ ] "Rim-Read ROI" leaderboard in GameStats (Points Generated per Rim Decision).
- [ ] Identification of "Primary Playmakers" vs. "Black Hole" drivers based on Kick-out frequency.

## [ ] [Live 'Defensive-Shell' Recovery Speed Tracker]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Most defensive collapses occur during "Recovery"—the time it takes for the shell to reset after a help rotation. Tracking "Recovery Speed" (time from help-tag to next close-out) identifies when the defense is "playing in sand."
**What:** A live gauge in the Tactical Identity HUD that tracks the average time between a `breakdownReason` event and the next successful `STOP` or `CONTEST`.
**Acceptance Criteria:**
- [ ] "Recovery Speed" metric (seconds) displayed in the Shell Integrity HUD.
- [ ] Visual alert: "Shell Stagnation" when recovery time exceeds 2.5 seconds.
- [ ] Correlation of "Recovery Speed" to opponent eFG% on secondary actions.

## [ ] [Live 'Winning-DNA' (Causal) Correlator]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Coaches often wonder, "What is the ONE thing we need to do to win *this* specific game?" The DNA Correlator identifies which KPI (e.g., "Defensive Rebounding" vs. "Paint Touches") has the highest correlation to the current lead.
**What:** A real-time correlation engine that calculates the R-value between live score-delta and various tactical KPIs, highlighting the "Key to the Game" in the Sidebar.
**Acceptance Criteria:**
- [ ] "Winning DNA" highlight in the Tactical Sidebar showing the most influential KPI.
- [ ] Live "Correlation Strength" indicator (Weak/Moderate/Strong).
- [ ] Dynamic adjustment of the "Key to the Game" as the game context shifts.

## [ ] [Live 'Transition-Leakage' Causal Auditor]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Transition defense is often the first thing to break under pressure. Identifying whether "Leakage" is caused by poor floor balance, slow retreat speed, or missed "First-Pass" pressure allows for immediate tactical correction.
**What:** An analytical HUD that activates after opponent transition scores, categorizing the failure based on player positioning and retreat timing data.
**Acceptance Criteria:**
- [ ] "Leakage Anatomy" display showing the primary cause of transition points (e.g., "Poor Floor Balance").
- [ ] Accountability Index: Identifying players with the slowest average retreat-to-rim speed.
- [ ] Alert: "Transition Vulnerability" if 2+ consecutive possessions end in opponent fast-break attempts.

## [ ] [Automated '2-for-1' & Clock-Leverage Advisor]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Managing the clock in the final 2 minutes of a quarter or game is a mathematical challenge that coaches often miss in high-stress moments. Automating the "2-for-1" window ensures the team maximizes possession volume.
**What:** A live clock-leverage indicator that glows when the "2-for-1" window is active and suggests the optimal shot-clock release time.
**Acceptance Criteria:**
- [ ] "2-for-1" visual alert in the Scoreboard HUD when the window opens (< 42s in period).
- [ ] Suggested release time (e.g., "Shoot by 32s") to ensure a final possession.
- [ ] "Clock Leverage" grade based on the team's adherence to end-of-period mathematical advantages.

## [ ] [Opponent 'Adjustment-Response' Detector]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Elite opponent coaches respond to our adjustments. If we start trapping #24, they will pivot to a "Slip" or "Short Roll." Detecting their *response* to our tactical pivot allows us to stay one move ahead.
**What:** An engine that monitors opponent play-type shifts specifically following a change in our active defensive scheme or tactical directive.
**Acceptance Criteria:**
- [ ] Alert: "Opponent Counter-Move: Adjusting to TRAP with High-Post Flash."
- [ ] "Adjustment ROI" tracking the efficiency of our pivot before and after the opponent counter-adjustment.
- [ ] Suggested "Counter-Counter" directive based on the detected opponent response.

## [ ] [ATO Execution & Directive ROI Auditor]
**Priority:** HIGH
**Type:** Analytics / Feature
**Why:** After-Timeout (ATO) plays are a signature of elite coaching. This auditor tracks the "Relay-to-Result" success rate, proving if the coach's huddle directives are actually translating into points.
**What:** A specialized tracking layer that bookmarks the first possession following every timeout and calculates the team's "ATO PPP" (Points Per Possession).
**Acceptance Criteria:**
- [ ] "ATO ROI" leaderboard showing the success rate of various play-types called out of timeouts.
- [ ] "Directive Accuracy" metric: % of ATO possessions that successfully executed the called play/directive.
- [ ] Post-game "ATO Efficiency" summary comparing our execution to the opponent's.

## [ ] [Live 'Defensive-Rotation' Stress Gauge]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** A defense can "hold" for 2-3 rotations before it inevitably breaks. Measuring the "Stress" (number of consecutive close-outs and tags) on the shell reveals when a collapse is imminent, even if the opponent hasn't scored yet.
**What:** A live gauge that tracks the "Rotation Count" (number of defensive responses to ball movement) within a single possession and flags "High-Stress" scenarios.
**Acceptance Criteria:**
- [ ] "Stress Gauge" in the Tactical Identity HUD showing the number of consecutive rotations required.
- [ ] Alert: "Shell Fatigue" when a possession exceeds 4 rotations.
- [ ] Suggested timeout or sub if a unit sustains 3+ "High-Stress" possessions in a row.

## [ ] [Live 'Strategic-Command' Relay & Verification Workflow]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** Even the best tactical directives are useless if they aren't relayed to the floor and executed. This workflow closes the loop by tracking the "Command-to-Relay" lag and verifying execution success.
**What:** A "Command Relay" interface in GameMode that allows the coach to "Dispatch" a suggested directive (e.g., "TRAP #24") and requires a one-tap "Relayed" confirmation, subsequently tracking the PPP for the next 3 possessions to verify the adjustment's impact.
**Acceptance Criteria:**
- [ ] One-tap "Dispatch Command" UI for suggested directives.
- [ ] "Relay Timer" tracking the latency between system suggestion and coach confirmation.
- [ ] "Post-Relay ROI" readout showing the efficiency delta on the 3 possessions following the directive.

## [ ] [Predictive 'Bonus-Optimization' Attack Advisor]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Entering the bonus early in a period is a massive mathematical advantage. This advisor doesn't just show the foul count; it predicts when the team *should* shift to "Aggressive Rim Attack" mode to maximize Free Throw ROI.
**What:** A live advisor that correlates opponent foul frequency with our rim attack efficiency to identify the "Bonus Threshold"—the exact moment when the expected value of a drive exceeds a jump shot due to foul probability.
**Acceptance Criteria:**
- [ ] "Aggressive Attack" glow on the Tactical HUD when Bonus ROI is maximized.
- [ ] Predictor: "Expected Bonus Entry in X possessions" based on live whistle flow.
- [ ] ROI Calculator: (Points from FTs per Foul) vs. (PPP on Non-Paint FGAs).

## [ ] [Live 'Gravity-Flow' (Inside-Out) ROI Gauge]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Coaches preach "Paint Touches," but the true value is often the resulting open 3. Quantifying the "Gravity ROI" (Inside-Out Flow) proves the system is working even if the perimeter shot misses.
**What:** A visualization in the Tactical Identity HUD that tracks "Inside-Out Possessions"—those where a paint touch preceded a perimeter shot—and calculates the PPP and Shot Quality (xPTS) for those specific sequences.
**Acceptance Criteria:**
- [ ] "Gravity Gauge" showing the % of possessions with an "Inside-Out" flow.
- [ ] "Flow ROI" metric: PPP on Inside-Out possessions vs. "Scramble" possessions.
- [ ] Alert: "Flow Stagnation" when 3 consecutive possessions lack a paint-to-perimeter relay.

## [ ] [Live 'Defensive-Anchor' Deterrence Tracker]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Elite rim protectors save points not just through blocks, but by *deterring* shots. Tracking "Rim Deterrence" (Opponent Rim Attempt Rate when X is on floor) reveals the true defensive anchors who don't show up in a box score.
**What:** An accountability metric that monitors the opponent's "Rim Pressure" (Attempts / Possessions) specifically when a designated "Defensive Anchor" is on the court versus on the bench.
**Acceptance Criteria:**
- [ ] "Deterrence Index" in the On/Off Impact HUD (Opponent Rim % ON vs OFF).
- [ ] Leaderboard for "Rim Deterrents" (Defenders with the lowest opponent rim frequency).
- [ ] Visual highlight: "Deterrence Shield" active on player cards with < 20% opponent rim rate.

## [ ] [Program-Wide 'Growth-Area' Development Tracker]
**Priority:** HIGH
**Type:** Feature / Longitudinal Analytics
**Why:** A season is a developmental journey. This tracker identifies the "Tactical Drifts" that occur over months, helping coaches see if their practice prescriptions are actually leading to improved game execution.
**What:** A longitudinal dashboard that overlays "Breakdown Reason" frequencies (e.g., "Missed Rotations") over a rolling 5-game window to identify if specific developmental "Growth Areas" are improving or regressing.
**Acceptance Criteria:**
- [ ] "Growth Trends" chart in the Program Dashboard tracking top 3 breakdown reasons over time.
- [ ] "Correction Rate" metric: Measuring the reduction in a specific breakdown type following a "Practice Prescription" PDF export.
- [ ] Alert: "Stagnant Growth" if a high-frequency breakdown persists for > 3 games.

## [ ] [Live 'Direct-Action' Strategic Command Engine]
**Priority:** HIGH
**Type:** Feature / Decision Automation
**Why:** Coaches often identify a tactical failure but take too long to formulate the specific fix. This engine translates live data outliers (e.g., "Opponent #24 eFG% > 70%") into direct, verbalizable commands for immediate execution.
**What:** A high-visibility "Command Console" in GameMode that suggests one of three specific tactical pivots (e.g., "FORCE LEFT", "TRAP ON CATCH", "Z-ZONE PUSH") based on live efficiency gaps.
**Acceptance Criteria:**
- [ ] "Command Console" UI element in the GameMode sidebar.
- [ ] Automated logic to select the most relevant "Direct-Action" command based on opponent efficiency.
- [ ] Visual "Quick-Call" badge showing the specific defensive or offensive command to relay to the floor.

## [ ] [Live 'Official-Player' Conflict Monitor]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Officiating "tightness" isn't uniform across players; some defensive styles (e.g., aggressive hand-checkers) are punished more by specific whistle flows. Monitoring this "style-to-ref friction" prevents avoidable foul-outs.
**What:** An intelligence layer that correlates a player's individual foul frequency with the current game's Ref-Tightness (FPM) to predict disqualification risk before the next foul occurs.
**Acceptance Criteria:**
- [ ] "Conflict Indicator" on player cards showing the risk level of their specific defensive style against the current whistle flow.
- [ ] Alert: "High-Risk Friction: Player X style vs. Ref Tightness" when a player reaches 3 fouls and FPM is > 0.8.
- [ ] Suggested substitution timing to protect high-risk defenders during "Tight" officiating windows.

## [ ] [Live 'Role-vs-Role' (Positional Parity) HUD]
**Priority:** HIGH
**Type:** Analytics / UX
**Why:** Team totals often hide where the game is being won or lost (e.g., "Our Guards are winning but our Bigs are getting dominated"). Positional Parity reveals the "Positional War" in real-time.
**What:** A 3-panel display in the Tactical HUD comparing aggregated efficiency (PPP and eFG%) of Guards, Wings, and Bigs against their opponent counterparts.
**Acceptance Criteria:**
- [ ] "Parity Panel" showing Guard-vs-Guard, Wing-vs-Wing, and Big-vs-Big efficiency deltas.
- [ ] Color-coded "Winning/Losing" status for each positional group.
- [ ] Visual alert: "Positional Collapse" when a group's eFG% delta falls below -15% relative to the opponent.

## [ ] [Post-Game 'Rotation ROI' Simulator]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** "What if" is the most common post-game question. Modeling alternative rotation scenarios helps coaches refine their "Closing Time" logic for future games.
**What:** An interactive simulation tool in GameStats that allows coaches to retroactively "slide" substitution timestamps to see the projected impact on Net Rating and final score.
**Acceptance Criteria:**
- [ ] Interactive Timeline in GameStats with draggable substitution nodes.
- [ ] Real-time recalculation of "Expected Score" based on the Net Rating of the simulated 5-man units.
- [ ] Comparison view: "Actual Result" vs "Simulated Rotation Result."

## [ ] [Opponent Coach 'Behavioral Profile' Tracker]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponent coaches have distinct behavioral patterns (e.g., "Always calls timeout after a 6-0 run" or "Switches to Zone after 3 straight paint scores"). Identifying these "Coaching Tells" allows for preemptive tactical preparing.
**What:** A behavioral engine that monitors opponent coaching actions (Timeouts, Subs, Scheme Changes) relative to game events to identify repeatable patterns.
**Acceptance Criteria:**
- [ ] "Coach Profile" section in the Opponent Scouting Report.
- [ ] Automated pattern detection: "Opponent Coach X typically calls timeout when the lead shrinks to < 4."
- [ ] Alert: "Expected Opponent Pivot: Zone Defense likely after that last score."

## [ ] [Live "Rotation Sustainability" Forecast]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Coaches often leave a productive lineup in too long, leading to a "Performance Cliff" due to hidden fatigue. Forecasting sustainability allows for proactive substitutions before the unit's efficiency drops.
**What:** A predictive engine that calculates the "Half-Life" of the current unit's Net Rating based on individual fatigue (Red-Line) and stint duration.
**Acceptance Criteria:**
- [ ] "Sustainability Timer" on the Lineup HUD showing estimated minutes remaining before expected efficiency decay.
- [ ] Visual alert: "Unit Red-Line Approaching" when 3+ on-court players exceed their fatigue threshold.
- [ ] Recommended "Bridge Lineup" to maintain lead while stars rest.

## [ ] [Opponent "Personnel Pivot" Alert]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponent coaches often have "Rotation Tells"—specific times or score-deltas when they sub their star back in. Anticipating this allows for preemptive counter-subs.
**What:** An automated detection engine that monitors opponent `SUB_IN` patterns and flags expected returns.
**Acceptance Criteria:**
- [ ] Alert: "Opponent Star #24 expected to return in < 60s (Rotation Node)."
- [ ] Suggested counter-lineup/matchup specifically for the returning threat.
- [ ] Historical "Return Probability" indicator on opponent bench cards.

## [ ] [Live "Process Integrity" Streak Tracker]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Shooting streaks are visible, but "Process Streaks" (e.g., 5 consecutive possessions with a paint touch) are the true drivers of winning. Tracking process integrity keeps players focused on the system even if shots miss.
**What:** A HUD element that tracks consecutive possessions meeting team-defined "Winning Process" criteria (e.g., Paint Touch, Extra Pass).
**Acceptance Criteria:**
- [ ] "Process Streak" counter in GameMode.
- [ ] Visual "System Synergy" reward/animation for reaching a 3-possession process streak.
- [ ] Alert: "Process Breakdown" when 3 consecutive possessions fail the "System Test."

## [ ] [Automated "Sub-Logic" Conflict Resolver]
**Priority:** HIGH
**Type:** Decision Support
**Why:** In the heat of the game, a coach might sub out a player who is actually the "Defensive Anchor" for the current unit without realizing it. Conflict resolution flags tactical risks before the sub is finalized.
**What:** A validation layer in the QuickSubDialog that identifies if a proposed substitution breaks a high-value defensive synergy or removes the primary rim protector.
**Acceptance Criteria:**
- [ ] "Conflict Warning" in the sub dialog (e.g., "Removing Primary Rim Protector while Opponent Rim % is High").
- [ ] Alternative sub recommendation that preserves the defensive floor.
- [ ] Logic to check "Unit Familiarity" for the proposed 5-man group.

## [ ] [Strategic "Timeout Value" Optimizer]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Timeouts are a finite resource. Coaches often "Burn" them too early in runs or save them too long. An optimizer provides an objective "Timeout Value" based on run severity and remaining game clock.
**What:** A live advisor that calculates the ROI of taking a timeout now vs. playing through the momentum.
**Acceptance Criteria:**
- [ ] "Timeout Recommended" glow on the timeout button during severe opponent runs.
- [ ] "Timeout Leverage Index" showing the cost/benefit based on remaining timeouts and game phase.
- [ ] Alert: "Hold Timeout" advice if the team has a high "System Integrity" score despite the run.

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

## [ ] [DEPS] Upgrade jest to 30.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep testing infrastructure up to date and benefit from new features/performance improvements in the latest major version.
**What:** Upgrade jest and related packages (@jest/globals, @types/jest, jest-environment-node, ts-jest) to 30.x across backend and frontend.
**Acceptance Criteria:**
- [ ] All tests pass with Jest 30.
- [ ] No regressions in test reporting or coverage.

## [ ] [DEPS] Upgrade @types/node to 25.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Align with the latest Node.js type definitions.
**What:** Upgrade @types/node to 25.x in both backend and frontend.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in both directories.

## [ ] [DEPS] Upgrade eslint-plugin-jsdoc to 63.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep documentation linting rules current.
**What:** Upgrade eslint-plugin-jsdoc to 63.x.
**Acceptance Criteria:**
- [ ] pnpm lint passes with no new errors.

## [ ] [DEPS] Upgrade @types/uuid to 11.x
**Priority:** CRITICAL
**Type:** Technical Debt
**Why:** Keep uuid type definitions current.
**What:** Upgrade @types/uuid to 11.x in backend.
**Acceptance Criteria:**
- [ ] Successful type checking (pnpm build) in backend.

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

## [ ] [Live Timeout Huddle Snapshot]
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

## [ ] [Opponent Tendency 'Scouting Badge' Overlay]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Scouting reports are useless if the coach has to look away from the court to remember them. Surfacing tendencies (e.g., "Drives Left 80%") directly on the live tracking card keeps the game plan in focus.
**What:** Integrate persistent scouting data into the live GameMode opponent cards as high-visibility "Tendency Badges."
**Acceptance Criteria:**
- [ ] "Tendency Badges" (e.g., "LEFTY", "STRETCH 4", "SHOOTER") on opponent tracking cards.
- [ ] Dynamic badge updates if the opponent deviates from season tendencies during the live game.
- [ ] One-tap access to the full scouting report for that specific player from the GameMode.

## [ ] [Live 'Process-over-Result' Confidence HUD]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Teams often abandon a winning offensive "Process" because shots aren't falling (Bad Luck). Surfacing the "Expected Points" vs "Actual Points" delta in real-time allows coaches to keep players focused on high-quality looks even during a shooting slump.
**What:** A live "Confidence Gauge" in GameMode that visualizes the totalXPts vs totalPoints delta.
**Acceptance Criteria:**
- [ ] A high-visibility "Confidence Gauge" that glows GREEN when xPTS > Actual Points (Good Process, Bad Luck).
- [ ] Real-time "Process Delta" (+/- xPTS) displayed in the Tactical HUD.
- [ ] Alert: "Trust the Process" triggered during a 0-for-5 slump on "OPEN" shots.

## [ ] [Opponent 'Tactical Shift' Detector]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponent coaches often pivot schemes (e.g., Man to Zone) or focal points (e.g., PnR to Post) mid-quarter. Detecting these shifts early allows for preemptive counter-adjustments before a run starts.
**What:** An automated detection engine that monitors opponent StatEvent patterns for significant deviations from their game-to-date baseline.
**Acceptance Criteria:**
- [ ] Alert: "Opponent Shift: 3 consecutive Zone possessions detected."
- [ ] Alert: "Opponent Shift: increased focus on RIM ATTACKS (+30% vs game average)."
- [ ] Visual indicator on the opponent card when their "Play-Type Frequency" shifts by >15%.

## [ ] [Live 'Unit Rhythm' Stagnation Alert]
**Priority:** HIGH
**Type:** Feature / Decision Support
**Why:** Lineups often "Stagnate" (efficiency cliffs) before the coach notices. Identifying "Rhythm Decay" within a single stint—rather than relying on overall game Net Rating—drives faster substitution decisions.
**What:** A stint-level efficiency monitor that tracks the "Decay Rate" of PPP for the active unit.
**Acceptance Criteria:**
- [ ] "Rhythm Meter" on the lineup HUD showing the stint's PPP trend (Rolling 3-possession average).
- [ ] Alert: "Unit Stagnation: PPP has dropped by 0.4 in the last 4 minutes."
- [ ] Suggested "Spark Plug" sub from the bench when stagnation is detected.

## [ ] [Automated 'Rim Protection' (Verticality) ROI]
**Priority:** HIGH
**Type:** Analytics / Causal Accountability
**Why:** Elite rim protection is often about "forcing a miss" through verticality rather than a block. Quantifying the points saved by defenders who don't record a counting stat reveals the team's true defensive anchors.
**What:** A "Verticality" metric derived from StatEvent data where a primaryDefenderId is linked to an opponent rim MISS without a BLOCK or STEAL.
**Acceptance Criteria:**
- [ ] "Verticality Score" in the accountability HUD (Points Saved per Rim Contest).
- [ ] Leaderboard for "Rim Deterrence" identifying players with the lowest Opponent Rim % when on-court.
- [ ] Attribution: Automatically link on-court "Defensive Anchor" to opponent rim misses.

## [ ] [Live 'Off-Ball' Defensive Accountability Tracker]
**Priority:** HIGH
**Type:** Feature / Causal Accountability
**Why:** Most points allowed aren't "blow-bys" but "late tags" or "missed rotations" off-ball. Isolating off-ball failures from primary defender failure is the key to fixing a leaky defense.
**What:** Expand the breakdownReason system to include "Off-Ball" categories (e.g., "Late Tag", "No Help") and attribute them to a secondaryDefenderId.
**Acceptance Criteria:**
- [ ] Addition of "Secondary Defender" selection to the Opponent Score/Breakdown workflow.
- [ ] "Off-Ball Failure" leaderboard in GameStats.
- [ ] Correlation matrix: identifying if specific pairs (Guard/Big) have a high "Missed Tag" rate on PnR.

## [ ] [Live 'Synergy Seam' Exposure Alert]
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

## [ ] [Live 'Expected Lead' (xLead) Gauge]
**Priority:** HIGH
**Type:** Feature / UX
**Why:** Coaches often overreact to a deficit that is actually just "Bad Luck" (cold shooting on good looks). The xLead gauge keeps the coaching staff calm by showing the score based on Shot Quality (xPTS).
**What:** A live secondary score display (e.g., "xScore: 42-38") that visualizes the game's progress based on expected value rather than actual makes.
**Acceptance Criteria:**
- [ ] "Expected Score" (xScore) display next to the actual score in GameMode.
- [ ] "Luck Delta" indicator: Color-coded to show if the team is overperforming or underperforming their process.
- [ ] Alert: "Stay the Course" triggered if xScore lead is > 5 while actual score is trailing.

## [ ] [Opponent 'Tactical Identity' Deviation Alert]
**Priority:** HIGH
**Type:** Predictive Intelligence
**Why:** Opponents often "break character" under pressure or after a timeout. Detecting when they stop running their primary sets or shift their shot profile allows for immediate counter-adjustments.
**What:** An engine that monitors live opponent play-type and location frequency and compares it to their season-long "Tactical Identity."
**Acceptance Criteria:**
- [ ] Alert: "Opponent Deviation: Increased Mid-Range frequency (+25% vs Season)."
- [ ] Alert: "Opponent Deviation: Abandoned PnR sets in the last 4 possessions."
- [ ] Visual indicator on the opponent card when they are playing "Off-Identity."
