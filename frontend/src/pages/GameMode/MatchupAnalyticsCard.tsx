/**
 * @file MatchupAnalyticsCard.tsx
 * @description Matchup analytics card showing Target Attack recommendation
 * and optional MatchupMatrix toggle. Replaces inline IIFE with useMemo.
 */
import React, { useMemo } from "react";
import { Box, Typography, IconButton, Stack, Chip } from "@mui/material";
import { GridOn } from "@mui/icons-material";
import { MoleskineCard } from "../../components/SharedUI";
import { MatchupMatrix } from "../../components/MatchupMatrix";
import { db } from "../../db";
import { syncService } from "../../utils/syncService";
import { type Player } from "../../db";

interface MatchupEfficiencyEntry {
  oppPlayerJersey: string;
  stopPct: number;
  possessions: number;
}

interface MatchupAnalyticsCardProps {
  matchupEfficiency: MatchupEfficiencyEntry[];
  showMatchupMatrix: boolean;
  onToggleMatrix: () => void;
  opponents: Player[];
  matchups: Record<string, string>;
  jerseyMap: Map<string, string>;
  players: Player[];
  onCourtIds: Set<string>;
  gameId: string | null;
  game: { matchups?: Record<string, string> } | null;
}

export const MatchupAnalyticsCard: React.FC<MatchupAnalyticsCardProps> = React.memo(
  ({
    matchupEfficiency,
    showMatchupMatrix,
    onToggleMatrix,
    opponents,
    matchups,
    jerseyMap,
    players,
    onCourtIds,
    gameId,
    game,
  }) => {
    // Replaces the inline IIFE — sorted once per matchupEfficiency change
    const targetAttack = useMemo(() => {
      const sorted = [...matchupEfficiency].sort((a, b) => a.stopPct - b.stopPct);
      return sorted[0] ?? null;
    }, [matchupEfficiency]);

    const hasEnoughData = targetAttack && targetAttack.possessions >= 3;

    return (
      <MoleskineCard aria-label="Matchup Analytics">
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="overline" fontWeight={700}>
            MATCHUP ANALYTICS
          </Typography>
          <IconButton
            size="small"
            onClick={onToggleMatrix}
            color={showMatchupMatrix ? "primary" : "default"}
            aria-label={showMatchupMatrix ? "Hide matchup matrix" : "Show matchup matrix"}
          >
            <GridOn fontSize="small" />
          </IconButton>
        </Stack>

        {!showMatchupMatrix && (
          <Box>
            <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
              Target Attack
            </Typography>
            {!hasEnoughData ? (
              <Typography variant="caption" color="text.secondary">
                Collecting data... (min. 3 possessions)
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={`#${targetAttack!.oppPlayerJersey}`}
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 800 }}
                />
                <Box>
                  <Typography variant="caption" display="block" fontWeight={700}>
                    Attack Opponent #{targetAttack!.oppPlayerJersey}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Stop %: {targetAttack!.stopPct}% ({targetAttack!.possessions} poss)
                  </Typography>
                </Box>
              </Stack>
            )}
          </Box>
        )}

        {showMatchupMatrix && (
          <MatchupMatrix
            opponents={opponents}
            matchupData={matchupEfficiency}
            jerseyMap={jerseyMap}
            currentMatchups={matchups}
            onReassign={async (oId, tId) => {
              if (!gameId) return;
              const newMatchups = {
                ...(matchups || {}),
                [oId]: matchups[oId] === tId ? "" : tId,
              };
              await db.games.update(gameId, { matchups: newMatchups, synced: 0 });
              await syncService.pushUpdates();
            }}
          />
        )}
      </MoleskineCard>
    );
  },
);

MatchupAnalyticsCard.displayName = "MatchupAnalyticsCard";
