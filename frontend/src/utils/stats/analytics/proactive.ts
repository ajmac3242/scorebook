import { ACTION_TYPES } from "../../../constants/stats";
import { StatEvent, Player } from "../../../db";
import { calculateElapsedMinutes } from "../../mathUtils";
import { isActive, isOpponentId, isFieldGoal } from "../aggregators";
import {
  OpponentThreat,
  PlayerAggregates,
  GameAnalyticsContext,
  HaltAlert,
} from "../types";

export const isClutchEvent = (
  eventPeriod: number,
  clockTime: number,
  scoreDiff: number,
  periodType: string,
): boolean => {
  if (Math.abs(scoreDiff) > 5) return false;

  const isQuarters = periodType === "QUARTERS";
  const isFinal = isQuarters ? eventPeriod === 4 : eventPeriod === 2;
  const isOT = isQuarters ? eventPeriod > 4 : eventPeriod > 2;

  if (!isFinal && !isOT) return false;
  if (isOT) return true;

  const regulationClutchTime = isQuarters ? 240 : 120;
  return clockTime <= regulationClutchTime;
};

export const calculateOpponentThreats = (
  stats: StatEvent[],
  params?: {
    period: number;
    clockTime: number;
    scoreDiff: number;
    periodType: string;
  },
): OpponentThreat[] => {
  const threats = new Map<string, OpponentThreat>();
  let currentGameId: string | null = null;

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    if (!isActive(s)) continue;

    if (s.gameId !== currentGameId) {
      currentGameId = s.gameId;
      threats.clear();
    }

    const isOpp = isOpponentId(s.playerId);

    if (!isOpp && s.type === ACTION_TYPES.MAKE) {
      for (const t of threats.values()) {
        t.straightPoints = 0;
      }
      continue;
    }

    if (!isOpp) continue;

    const pId = s.playerId;
    let t = threats.get(pId);
    if (!t) {
      t = {
        playerId: pId,
        points: 0,
        makes: 0,
        consecutiveMakes: 0,
        straightPoints: 0,
        isHot: false,
        isClutchThreat: false,
      };
      threats.set(pId, t);
    }

    if (s.type === ACTION_TYPES.MAKE) {
      t.points += s.points || 0;
      t.straightPoints += s.points || 0;
      if (isFieldGoal(s)) {
        t.makes++;
        t.consecutiveMakes++;
      }

      const isClutch = params
        ? isClutchEvent(
            params.period,
            params.clockTime,
            params.scoreDiff,
            params.periodType,
          )
        : false;

      if (t.points >= 8 || t.consecutiveMakes >= 3 || t.straightPoints >= 6) {
        t.isHot = true;
      }

      if (isClutch && (t.isHot || t.points >= 10)) {
        t.isClutchThreat = true;
      }
    } else if (s.type === ACTION_TYPES.MISS) {
      if (isFieldGoal(s)) {
        t.consecutiveMakes = 0;
      }
    }
  }

  return Array.from(threats.values()).filter(
    (t) => t.isHot || t.isClutchThreat,
  );
};

export const calculateHaltAlerts = (params: {
  players: Player[];
  statsMap: Map<string, PlayerAggregates>;
  gameData: GameAnalyticsContext;
  period: number;
  clockSeconds: number;
  periodType: string;
  maxStintDuration: number;
  jerseyMap: Map<string, string | undefined>;
  archetypeEfficiency?: Record<string, Record<string, number>>;
  oppMostFrequentPlayType?: Record<string, string>;
  matchups?: Record<string, string>;
}): HaltAlert[] => {
  const alerts: HaltAlert[] = [];
  const {
    players,
    statsMap,
    gameData,
    period,
    clockSeconds,
    periodType,
    maxStintDuration,
    jerseyMap,
    archetypeEfficiency = {},
    oppMostFrequentPlayType = {},
    matchups = {},
  } = params;

  // 1. Star Player Foul Warning
  for (const p of players) {
    if (p.isStar !== 1 || !gameData.onCourtIds.has(p.id)) continue;

    const fouls = statsMap.get(p.id!)?.fouls || 0;
    const isFoulTrouble =
      (period === 1 && fouls >= 2) ||
      (period === 2 && fouls >= 3) ||
      fouls >= 4;

    if (isFoulTrouble) {
      alerts.push({
        id: `foul-${p.id}`,
        type: "FOUL",
        severity: fouls >= 4 ? "error" : "warning",
        message: `Star Foul Trouble: #${jerseyMap.get(p.id!)} (${fouls} PF)`,
        playerId: p.id,
        jerseyNumber: jerseyMap.get(p.id!),
      });
    }
  }

  // 2. Bonus Approaching Alert
  const bonusLimit = periodType === "QUARTERS" ? 5 : 7;
  const oppFouls = gameData.teamFoulStats.oppFouls;
  if (oppFouls === bonusLimit - 1) {
    alerts.push({
      id: "bonus-approaching",
      type: "BONUS",
      severity: "info",
      message: `Opponent in Foul Trouble (${oppFouls}/${bonusLimit})`,
    });
  } else if (oppFouls >= bonusLimit) {
    alerts.push({
      id: "in-bonus",
      type: "BONUS",
      severity: "warning",
      message: "BONUS ACTIVE: Attack the Rim",
    });
  }

  // 3. Time to Sub fatigue alerts
  for (const pId of gameData.onCourtIds) {
    const duration = gameData.stintDurations.get(pId) || 0;
    if (duration <= maxStintDuration * 60) continue;

    alerts.push({
      id: `fatigue-${pId}`,
      type: "FATIGUE",
      severity: "warning",
      message: `Fatigue Alert: #${jerseyMap.get(pId)} (${Math.floor(duration / 60)}m)`,
      playerId: pId,
      jerseyNumber: jerseyMap.get(pId),
    });
  }

  // 4. Clutch Mode Alert
  const isClutch = isClutchEvent(
    period,
    clockSeconds,
    gameData.currentScore - gameData.opponentScore,
    periodType,
  );
  if (isClutch) {
    alerts.push({
      id: "clutch-mode",
      type: "CLUTCH",
      severity: "error",
      message: "🔥 CLUTCH MODE ACTIVE",
    });
  }

  // 5. Ref-Identity Conflict Alert
  const isHighPressure =
    gameData.activeDefensiveScheme === "PRESS" ||
    gameData.activeDefensiveScheme === "DOUBLE";

  const elapsedMinutes = calculateElapsedMinutes(
    period,
    clockSeconds,
    periodType,
  );
  const fpm =
    elapsedMinutes > 1
      ? (gameData.teamFoulStats.teamFouls + gameData.teamFoulStats.oppFouls) /
        elapsedMinutes
      : 0;

  if (isHighPressure && fpm > 0.8) {
    alerts.push({
      id: "ref-conflict",
      type: "REF_CONFLICT",
      severity: "error",
      message: "⚠️ REF CONFLICT: Dial Back Pressure",
    });
  }

  // 6. Mismatched Archetype Alert
  Object.entries(matchups).forEach(([oppId, teamPlayerId]) => {
    if (!teamPlayerId || !gameData.onCourtIds.has(teamPlayerId)) return;
    const frequentPlayType = oppMostFrequentPlayType[oppId];
    if (frequentPlayType) {
      const efficiency =
        archetypeEfficiency[teamPlayerId]?.[frequentPlayType] || 0;
      if (efficiency > 0 && efficiency < 40) {
        const oppJersey = oppId.includes(":") ? oppId.split(":")[1] : "??";
        alerts.push({
          id: `mismatch-${oppId}`,
          type: "CONFLICT",
          severity: "warning",
          message: `Archetype Mismatch: #${jerseyMap.get(teamPlayerId)} struggling vs #${oppJersey} (${frequentPlayType})`,
          actionLabel: "Change Matchup",
        });
      }
    }
  });

  // 7. Neural Exhaustion Alert
  if (gameData.neuralLoad && gameData.neuralLoad.unitSpm > 1.5) {
    alerts.push({
      id: "neural-exhaustion",
      type: "NEURAL",
      severity: "error",
      message: "Neural Exhaustion Imminent: SPM > 1.5. Suggest Low-Entropy Script (Man/Iso).",
    });
  }

  // 8. Predictability Alert
  if (gameData.predictability && gameData.predictability.score > 70) {
    alerts.push({
      id: "predictability-alert",
      type: "PREDICTABILITY",
      severity: "warning",
      message: `Pattern Detected: Opponent anticipating ${gameData.predictability.pattern || "plays"}. Use Algorithmic Breaker.`,
    });
  }

  // 9. Verbal Velocity Alert
  if (gameData.verbalVelocity && gameData.verbalVelocity.latency > 0.4) {
    alerts.push({
      id: "vocal-latency",
      type: "COMMUNICATION",
      severity: "warning",
      message: `Communication Delay: ${gameData.verbalVelocity.latency}s latency. Defensive shell at risk.`,
    });
  }

  return alerts;
};
