import { useMemo } from "react";
import { StatEvent, Team, Game } from "../db";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculateStopsAndKills,
  calculatePossessions,
  calculatePpp,
  isEventInPeriod,
  getBonusStatus,
  calculateOpponentThreats,
  calculateNeuralLoad,
  calculatePredictabilityScore,
  calculateVerbalVelocity,
  OpponentThreat,
  isOpponentId,
  isFoulAction,
  isScoringEvent,
  isFreeThrow,
} from "../utils/stats";
import { calculateElapsedMinutes } from "../utils/mathUtils";

export const useGameAggregator = (
  sortedGameStats: StatEvent[],
  period: number,
  clockSeconds: number,
  team: Team | undefined,
  game: Game | undefined,
) => {
  const eventAggregates = useMemo(() => {
    let curScore = 0;
    let oppScore = 0;
    let teamFouls = 0;
    let oppFouls = 0;
    let teamTimeouts = 0;
    let oppTimeouts = 0;
    let posState = null;
    const onCourt = new Set<string>();
    const stintStarts = new Map<string, number>();
    const onCourtPeriodFouls = new Map<string, number>();
    const pType = team?.periodType || "QUARTERS";
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    let lastLineupChangeClock = periodLen;
    let lastLineupChangeScoreTeam = 0;
    let lastLineupChangeScoreOpp = 0;
    let periodStartScoreTeam = 0;
    let periodStartScoreOpp = 0;

    let teamFga = 0,
      teamFta = 0,
      teamTo = 0,
      teamOreb = 0;
    let oppFga = 0,
      oppFta = 0,
      oppTo = 0,
      oppOreb = 0;

    const schemeStats: Record<
      string,
      { points: number; fga: number; fta: number; to: number }
    > = {
      MAN: { points: 0, fga: 0, fta: 0, to: 0 },
      ZONE: { points: 0, fga: 0, fta: 0, to: 0 },
      PRESS: { points: 0, fga: 0, fta: 0, to: 0 },
      DOUBLE: { points: 0, fga: 0, fta: 0, to: 0 },
    };

    let lastTeamScoreClockTime = periodLen;
    let lastTeamScorePeriod = 1;
    let foundLastTeamScore = false;

    const threats = new Map<string, OpponentThreat>();
    let possessionStartClock = periodLen;

    for (const s of sortedGameStats) {
      if (s.deletedAt) continue;
      const isOpp = isOpponentId(s.playerId);

      if (isOpp) {
        oppScore += s.points || 0;
        if (isScoringEvent(s)) {
          if (isFreeThrow(s)) oppFta++;
          else oppFga++;
        }

        if (s.defensiveScheme && schemeStats[s.defensiveScheme]) {
          const scheme = schemeStats[s.defensiveScheme];
          if (isScoringEvent(s)) {
            scheme.points += s.points || 0;
            if (isFreeThrow(s)) scheme.fta++;
            else scheme.fga++;
          } else if (s.type === ACTION_TYPES.MISS) {
            if (isFreeThrow(s)) scheme.fta++;
            else scheme.fga++;
          } else if (s.type === ACTION_TYPES.TURNOVER) {
            scheme.to++;
          }
        }
      } else {
        curScore += s.points || 0;
        if (isScoringEvent(s)) {
          lastTeamScoreClockTime = s.clockTime ?? periodLen;
          lastTeamScorePeriod = s.period;
          foundLastTeamScore = true;
          if (isFreeThrow(s)) teamFta++;
          else teamFga++;
        }
      }

      if (isFoulAction(s)) {
        if (isEventInPeriod(s.period, period, pType)) {
          if (isOpp) oppFouls++;
          else {
            teamFouls++;
            if (onCourt.has(s.playerId)) {
              onCourtPeriodFouls.set(
                s.playerId,
                (onCourtPeriodFouls.get(s.playerId) || 0) + 1,
              );
            }
          }
        }
      }

      if (s.type === ACTION_TYPES.TIMEOUT) {
        if (isOpp) oppTimeouts++;
        else teamTimeouts++;
      }

      if (s.type === ACTION_TYPES.POSSESSION) {
        posState = s.playerId;
        possessionStartClock = s.clockTime ?? periodLen;
      }

      if (isOpp) {
        if (s.type === ACTION_TYPES.MISS) {
          if (isFreeThrow(s)) oppFta++;
          else {
            oppFga++;
            const t = threats.get(s.playerId);
            if (t) t.consecutiveMakes = 0;
          }
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) oppOreb++;
        if (s.type === ACTION_TYPES.TURNOVER) {
          oppTo++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (isScoringEvent(s) && !isFreeThrow(s)) {
          possessionStartClock = s.clockTime ?? periodLen;
          let t = threats.get(s.playerId);
          if (!t) {
            t = {
              playerId: s.playerId,
              points: 0,
              makes: 0,
              consecutiveMakes: 0,
              straightPoints: 0,
              isHot: false,
            };
            threats.set(s.playerId, t);
          }
          t.points += s.points || 0;
          t.makes++;
          t.consecutiveMakes++;
          if (t.points >= 8 || t.consecutiveMakes >= 3) t.isHot = true;
        }
      } else {
        if (s.type === ACTION_TYPES.MISS) {
          if (isFreeThrow(s)) teamFta++;
          else teamFga++;
        } else if (s.type === ACTION_TYPES.OFF_REBOUND) {
          teamOreb++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          teamTo++;
          possessionStartClock = s.clockTime ?? periodLen;
        } else if (isScoringEvent(s) && !isFreeThrow(s)) {
          possessionStartClock = s.clockTime ?? periodLen;
        }
      }

      if (s.type === ACTION_TYPES.SUB_IN) {
        onCourt.add(s.playerId);
        if (s.period === period) {
          stintStarts.set(s.playerId, s.clockTime ?? periodLen);
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      } else if (s.type === ACTION_TYPES.SUB_OUT) {
        onCourt.delete(s.playerId);
        stintStarts.delete(s.playerId);
        if (s.period === period) {
          lastLineupChangeClock = s.clockTime ?? lastLineupChangeClock;
          lastLineupChangeScoreTeam = curScore;
          lastLineupChangeScoreOpp = oppScore;
        }
      }

      if (s.period < period) {
        periodStartScoreTeam = curScore;
        periodStartScoreOpp = oppScore;
      }
    }

    if (
      lastLineupChangeClock === periodLen &&
      lastLineupChangeScoreTeam === 0
    ) {
      lastLineupChangeScoreTeam = periodStartScoreTeam;
      lastLineupChangeScoreOpp = periodStartScoreOpp;
    }

    onCourt.forEach((pId) => {
      if (!stintStarts.has(pId)) stintStarts.set(pId, periodLen);
    });

    const rawDefensiveStats = calculateStopsAndKills(sortedGameStats);
    const teamPoss = calculatePossessions(teamFga, teamFta, teamTo, teamOreb);
    const oppPoss = calculatePossessions(oppFga, oppFta, oppTo, oppOreb);

    const defensiveStats = {
      ...rawDefensiveStats,
      stopPct:
        oppPoss > 0
          ? Math.round((rawDefensiveStats.totalStops / oppPoss) * 100)
          : 0,
    };

    let opponentRunValue = null;
    let tempOppRunPoints = 0;
    let teamScoredSinceOppRunStarted = false;
    for (let i = sortedGameStats.length - 1; i >= 0; i--) {
      const s = sortedGameStats[i];
      if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
      if (isOpp) {
        if (teamScoredSinceOppRunStarted) break;
        tempOppRunPoints += s.points || 0;
      } else {
        teamScoredSinceOppRunStarted = true;
        break;
      }
    }
    if (tempOppRunPoints >= 8) opponentRunValue = `${tempOppRunPoints}-0`;

    let teamRunValue = null;
    let tempTeamRunPoints = 0;
    let oppScoredSinceTeamRunStarted = false;
    for (let i = sortedGameStats.length - 1; i >= 0; i--) {
      const s = sortedGameStats[i];
      if (s.deletedAt || s.type !== ACTION_TYPES.MAKE) continue;
      const isOpp =
        s.playerId === SPECIAL_PLAYER_IDS.OPPONENT ||
        s.playerId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
      if (!isOpp) {
        if (oppScoredSinceTeamRunStarted) break;
        tempTeamRunPoints += s.points || 0;
      } else {
        oppScoredSinceTeamRunStarted = true;
        break;
      }
    }
    if (tempTeamRunPoints >= 8) teamRunValue = `${tempTeamRunPoints}-0`;

    const MAX_TIMEOUTS = team?.fouls || 3;
    const teamBonus = getBonusStatus(teamFouls, pType);
    const oppBonus = getBonusStatus(oppFouls, pType);
    const elapsedMinutes = calculateElapsedMinutes(
      period,
      clockSeconds,
      team?.periodType,
    );
    const fpm =
      elapsedMinutes > 1 ? (teamFouls + oppFouls) / elapsedMinutes : 0;

    const neuralLoad = calculateNeuralLoad(
      sortedGameStats,
      onCourt,
      periodLen,
    );
    const predictability = calculatePredictabilityScore(sortedGameStats);
    const verbalVelocity = calculateVerbalVelocity(sortedGameStats);

    return {
      currentScore: curScore,
      opponentScore: oppScore,
      teamPpp: calculatePpp(curScore, teamPoss),
      oppPpp: calculatePpp(oppScore, oppPoss),
      refTightness: fpm,
      neuralLoad,
      predictability,
      verbalVelocity,
      teamPoss,
      oppPoss,
      teamFoulStats: {
        teamFouls,
        oppFouls,
        teamBonusLabel: teamBonus.label,
        teamIsDouble: teamBonus.isDouble,
        teamBonusColor: teamBonus.color,
        oppBonusLabel: oppBonus.label,
        oppIsDouble: oppBonus.isDouble,
        oppBonusColor: oppBonus.color,
      },
      timeoutStats: {
        teamTOL: Math.max(0, MAX_TIMEOUTS - teamTimeouts),
        oppTOL: Math.max(0, MAX_TIMEOUTS - oppTimeouts),
      },
      possessionState: posState,
      schemeEfficiency: Object.entries(schemeStats).map(([name, s]) => {
        const poss = calculatePossessions({
          fga: s.fga,
          fta: s.fta,
          turnovers: s.to,
          offRebounds: 0,
        });
        return { name, ppp: calculatePpp(s.points, poss), possessions: poss };
      }),
      onCourtIds: onCourt,
      stintStarts,
      defensiveStats,
      momentumAlerts: {
        opponentRun: opponentRunValue,
        teamRun: teamRunValue,
        opponentThreats: calculateOpponentThreats(sortedGameStats, {
          period,
          clockTime: clockSeconds,
          scoreDiff: curScore - oppScore,
          periodType: team?.periodType || "QUARTERS",
        }),
      },
      onCourtPeriodFouls,
      lastLineupChangeClock,
      lastLineupChangeScoreTeam,
      lastLineupChangeScoreOpp,
      lastTeamScoreClockTime,
      lastTeamScorePeriod,
      foundLastTeamScore,
      possessionStartClock,
      recentStats: sortedGameStats
        .filter((s) => !s.deletedAt)
        .slice(-10)
        .reverse(),
    };
  }, [
    sortedGameStats,
    period,
    clockSeconds,
    team?.periodType,
    team?.fouls,
    game,
  ]);

  const gameData = useMemo(() => {
    const stintDurations = new Map<string, number>();
    eventAggregates.stintStarts.forEach((startClock, pId) => {
      stintDurations.set(pId, Math.max(0, startClock - clockSeconds));
    });

    let scoringDrought = null;
    const periodLen = game?.periodLength ? game.periodLength * 60 : 600;

    if (eventAggregates.foundLastTeamScore) {
      let droughtSecs = 0;
      if (eventAggregates.lastTeamScorePeriod === period) {
        droughtSecs = eventAggregates.lastTeamScoreClockTime - clockSeconds;
      } else if (eventAggregates.lastTeamScorePeriod < period) {
        droughtSecs =
          eventAggregates.lastTeamScoreClockTime +
          (period - eventAggregates.lastTeamScorePeriod - 1) * periodLen +
          (periodLen - clockSeconds);
      }
      if (droughtSecs >= 180)
        scoringDrought = `${Math.floor(droughtSecs / 60)}m ${Math.floor(droughtSecs % 60)}s`;
    } else {
      const elapsedGameSecs =
        (period - 1) * periodLen + (periodLen - clockSeconds);
      if (elapsedGameSecs >= 180)
        scoringDrought = `${Math.floor(elapsedGameSecs / 60)}m ${Math.floor(elapsedGameSecs % 60)}s`;
    }

    const totalElapsedSeconds =
      (period - 1) * periodLen + (periodLen - clockSeconds);
    const totalPossessions = eventAggregates.teamPoss + eventAggregates.oppPoss;
    const livePace =
      totalElapsedSeconds > 0
        ? (totalPossessions / (totalElapsedSeconds / 60)) * 40
        : 0;

    return {
      ...eventAggregates,
      stintDurations,
      livePace,
      currentLineupPlusMinus:
        eventAggregates.currentScore -
        eventAggregates.opponentScore -
        (eventAggregates.lastLineupChangeScoreTeam -
          eventAggregates.lastLineupChangeScoreOpp),
      currentLineupStintDuration: Math.max(
        0,
        eventAggregates.lastLineupChangeClock - clockSeconds,
      ),
      momentumAlerts: { ...eventAggregates.momentumAlerts, scoringDrought },
    };
  }, [eventAggregates, clockSeconds, period, game]);

  return {
    eventAggregates,
    gameData,
  };
};
