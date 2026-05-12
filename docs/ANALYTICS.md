# Analytics Engine: Formulas & Logic

Scorebook is built on **Causal Accountability**. This document defines the formulas and logic used to derive the tactical intelligence provided to coaches.

## 1. Possession Efficiency (PPP)
The gold standard for measuring offensive and defensive quality, independent of game pace.

**Formula:**
$$PPP = \frac{\text{Total Points}}{\text{Possessions}}$$

**Possession Calculation:**
$$Possessions = FGA + (0.44 \times FTA) + TO - OREB$$

- **Offensive PPP**: Measured for our team and individual lineups.
- **Defensive PPP**: Measures points allowed per opponent possession.

## 2. Shooting Efficiency (eFG%)
Adjusts for the fact that a 3-point shot is worth more than a 2-point shot.

**Formula:**
$$eFG\% = \frac{FG + (0.5 \times 3PM)}{FGA}$$

## 3. Spark Plug Momentum Index
Identifies players who trigger team-wide energy shifts through "Blue Collar" hustle.

**Logic:**
1. Identify **Hustle Events**: Floor Dives, Charges Taken, Great Contests.
2. Track **Subsequent Scoring**: Total team points scored in the 120 seconds following a hustle event.
3. **Composite Index**:
   $$Index = (Hustle \times 2) + (\frac{\text{Momentum Points}}{2})$$

## 4. Expected Points (xPTS) & Shot ROI
Moves the conversation from results to quality by evaluating the "Process" of the offense.

**Logic:**
Every shot is assigned an **xPTS** value based on:
- **Zone**: (e.g., Rim, Paint, Corner 3, Wing 3).
- **Shot Quality**: (Open vs. Contested).

**Shot ROI Formula:**
$$ROI = \frac{\text{Actual Points}}{\text{Total xPTS}} - 1.0$$
*A positive ROI indicates finishing above expectations; a negative ROI suggests a "cold" night despite good process.*

## 5. Matchup Stop % (Holistic Matrix)
Attributes defensive success to the primary defender responsible for the opponent's action.

**Formula:**
$$Stop \% = \frac{\text{Opponent Misses} + \text{Opponent Turnovers}}{\text{Total Possessions Defended}}$$

## 6. Defensive Integrity (Breakdown Attribution)
Categorizes points allowed by tactical failure to drive causal accountability.

**Categories:**
- **Missed Rotation**: Failure to help or recover.
- **Transition Leak**: Giving up easy buckets in transition.
- **Poor Closeout**: Allowing a drive or open shot due to lazy approach.
- **Out-Hustled**: Losing 50/50 balls or offensive rebounds.
- **Great Contest**: The opponent simply made a tough, well-defended shot.

## 7. Shot Clock Process Analysis
Evaluates offensive discipline by timing.

- **Early Clock**: First 10 seconds (Transition/Primary Break).
- **Mid Clock**: Settled half-court sets.
- **Late Clock**: Final 5 seconds (Emergency/ISO).

Efficiency (eFG%) is tracked across these phases to identify if the team is "rushing" or "executing."

## 8. Fatigue Decay Model
Monitors a player's stint duration and alerts the coach when efficiency is likely to drop.

**Logic:**
- Triggers a "Fatigue Alert" when a player's continuous stint exceeds the configured **Max Stint Duration** (default: 8 minutes).
- Correlates stint length with a drop-off in hustle events and eFG%.
