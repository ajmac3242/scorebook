/**
 * @file MatchupAnalyticsCard.tsx
 * @description Matchup analytics card showing Target Attack recommendation
 * and optional MatchupMatrix toggle. Replaces inline IIFE with useMemo.
 */
import React, { useMemo } from "react";
import { useTokens } from "../../theme/useTokens";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import { GridOn } from "@mui/icons-material";
import { SurfaceCard } from "../../components/cards/SurfaceCard";
import { MatchupMatrix } from "../../components/data-display/MatchupMatrix";
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

export const MatchupAnalyticsCard: React.FC<MatchupAnalyticsCardProps> =
  React.memo(
    ({
      matchupEfficiency,
      showMatchupMatrix,
      onToggleMatrix,
      opponents,
      matchups,
      jerseyMap,
      onCourtIds,
      gameId,
    }) => {
      const tokens = useTokens();
      // Replaces the inline IIFE — sorted once per matchupEfficiency change
      const targetAttack = useMemo(() => {
        const sorted = [...matchupEfficiency].sort(
          (a, b) => a.stopPct - b.stopPct,
        );
        return sorted[0] ?? null;
      }, [matchupEfficiency]);

      const hasEnoughData = targetAttack && targetAttack.possessions >= 3;

      return (
        <SurfaceCard aria-label="Matchup Analytics">
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: tokens.semantic.spacing.xs,
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
              MATCHUP ANALYTICS
            </Typography>
            <Tooltip
              title={
                showMatchupMatrix
                  ? "Hide matchup matrix"
                  : "Show matchup matrix"
              }
            >
              <IconButton
                size="small"
                onClick={onToggleMatrix}
                color={showMatchupMatrix ? "primary" : "default"}
                aria-label={
                  showMatchupMatrix
                    ? "Hide matchup matrix"
                    : "Show matchup matrix"
                }
              >
                <GridOn fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {!showMatchupMatrix && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  display: "block",
                  mb: tokens.semantic.spacing.xs / 8,
                }}
              >
                Target Attack
              </Typography>
              {!hasEnoughData ? (
                <Typography
                  variant="caption"
                  sx={{ color: tokens.semantic.color.text.secondary }}
                >
                  Collecting data... (min. 3 possessions)
                </Typography>
              ) : (
                <Stack
                  direction="row"
                  spacing={tokens.semantic.spacing.xs / 8}
                  sx={{ alignItems: "center" }}
                >
                  <Chip
                    label={`#${targetAttack!.oppPlayerJersey}`}
                    color="warning"
                    size="small"
                    aria-label={`Target attack opponent jersey number ${targetAttack!.oppPlayerJersey}`}
                    sx={{ fontWeight: tokens.typography.fontWeight.black }}
                  />
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                    >
                      Attack Opponent #{targetAttack!.oppPlayerJersey}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: tokens.semantic.color.text.secondary,
                        display: "block",
                      }}
                    >
                      Stop %: {targetAttack!.stopPct}% (
                      {targetAttack!.possessions} poss)
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          )}

          {showMatchupMatrix && (
            <MatchupMatrix
              teamActiveIds={Array.from(onCourtIds)}
              oppActiveIds={opponents.map((o) => o.id)}
              matchupData={matchupEfficiency as never}
              jerseyMap={jerseyMap}
              currentMatchups={matchups}
              onReassign={async (oId, tId) => {
                if (!gameId) return;
                const newMatchups = {
                  ...(matchups || {}),
                  [oId]: matchups[oId] === tId ? "" : tId,
                };
                await db.games.update(gameId, {
                  matchups: newMatchups,
                  synced: 0,
                });
                await syncService.pushUpdates();
              }}
            />
          )}
        </SurfaceCard>
      );
    },
  );

MatchupAnalyticsCard.displayName = "MatchupAnalyticsCard";
