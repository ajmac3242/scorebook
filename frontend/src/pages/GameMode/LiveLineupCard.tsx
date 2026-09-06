/**
 * @file LiveLineupCard.tsx
 * @description Live on-court lineup display with stint timer, plus/minus,
 * player buttons, empty slot placeholders, and chain action prompt.
 */
import React from "react";
import { Box, Typography, Stack, Button, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { SurfaceCard } from "../../components/cards/SurfaceCard";
import { LineupPlayerButton } from "./GameModeComponents";
import { type Player, type Game, type Team, type StatEvent } from "../../db";
import { type PlayerAggregates } from "../../utils/stats";
import { formatClock, formatPlusMinus } from "../../utils/mathUtils";
import { useTokens } from "../../theme/useTokens";

interface ChainPrompt {
  type: "REBOUND" | "ASSIST" | "HOCKEY_ASSIST";
  originalStat: Pick<StatEvent, "period" | "clockTime" | "timestamp">;
}

interface LiveLineupCardProps {
  players: Player[];
  onCourtIds: Set<string>;
  game: Game | null;
  team: Team | null;
  statsMap: Map<string, PlayerAggregates>;
  jerseyMap: Map<string, string>;
  currentLineupStintDuration: number;
  currentLineupPlusMinus: number;
  period: number;
  isReadOnly: boolean;
  chainPrompt: ChainPrompt | null;
  stintDurations?: Map<string, number>;
  playerStreaks?: Map<string, string>;
  periodFoulMap?: Map<string, number>;
  onPlayerClick: (_playerId: string) => void;
  onEmptySlotClick: (_slotId: string) => void;
  onChainAction: (_playerId: string, _type: string) => void;
  onDismissChain: () => void;
}

export const LiveLineupCard: React.FC<LiveLineupCardProps> = React.memo(
  ({
    players,
    onCourtIds,
    game,
    team,
    statsMap,
    jerseyMap,
    currentLineupStintDuration,
    currentLineupPlusMinus,
    period,
    isReadOnly,
    chainPrompt,
    playerStreaks,
    stintDurations,
    periodFoulMap,
    onPlayerClick,
    onEmptySlotClick,
    onChainAction,
    onDismissChain,
  }) => {
    const tokens = useTokens();
    const onCourtPlayers = players.filter((p) => onCourtIds.has(p.id!));
    const emptySlotCount = Math.max(0, 5 - onCourtIds.size);

    return (
      <>
        <SurfaceCard aria-label="Live Lineup">
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: tokens.semantic.spacing.xs / 8,
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
              Live Lineup
            </Typography>
            <Stack
              direction="row"
              spacing={tokens.semantic.spacing.xs / 8}
              sx={{ alignItems: "center" }}
            >
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                STINT:&nbsp;
                <Box
                  component="span"
                  sx={{ fontWeight: tokens.typography.fontWeight.bold }}
                >
                  {formatClock(currentLineupStintDuration)}
                </Box>
              </Typography>
              <Typography
                variant="body2"
                data-testid="lineup-plus-minus"
                sx={{
                  fontWeight: tokens.typography.fontWeight.black,
                  color:
                    currentLineupPlusMinus >= 0
                      ? tokens.semantic.color.feedback.success.main
                      : tokens.semantic.color.feedback.error.main,
                  lineHeight: 1,
                  fontSize: tokens.typography.fontSize.md,
                }}
              >
                {formatPlusMinus(currentLineupPlusMinus)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                Net Impact
              </Typography>
            </Stack>
          </Stack>

          <Stack spacing={0.5}>
            {onCourtPlayers.map((p) => (
              <LineupPlayerButton
                key={p.id}
                player={p}
                stats={statsMap.get(p.id!)}
                jerseyNumber={jerseyMap.get(p.id!) ?? "??"}
                isReadOnly={isReadOnly}
                period={period}
                game={game}
                team={team}
                stintSecs={stintDurations?.get(p.id!) ?? 0}
                periodFouls={periodFoulMap?.get(p.id!) ?? 0}
                streak={playerStreaks?.get(p.id!)}
                onClick={onPlayerClick}
              />
            ))}

            {Array.from({ length: emptySlotCount }).map((_, i) => {
              const emptyId = `EMPTY-${i}`;
              return (
                <Button
                  key={emptyId}
                  aria-label={`Empty lineup slot ${i + 1}`}
                  onClick={() => onEmptySlotClick(emptyId)}
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    borderStyle: "dashed",
                    color: tokens.semantic.color.text.secondary,
                    px: tokens.semantic.spacing.xs / 8,
                    minHeight: tokens.touch.targetComfortable,
                  }}
                >
                  + Empty Slot
                </Button>
              );
            })}
          </Stack>
        </SurfaceCard>

        {chainPrompt && (
          <SurfaceCard
            sx={{
              bgcolor: tokens.semantic.color.brand.primary.main,
              color: tokens.semantic.color.brand.primary.contrastText,
            }}
            aria-label="Chain action prompt"
          >
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: tokens.semantic.spacing.xs / 8,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: tokens.typography.fontWeight.black,
                  color: tokens.semantic.color.brand.primary.contrastText,
                }}
              >
                WHO GOT THE {chainPrompt.type}?
              </Typography>
              <IconButton
                size="small"
                onClick={onDismissChain}
                sx={{
                  color: tokens.semantic.color.brand.primary.contrastText,
                }}
                aria-label="Dismiss chain action"
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
            <Stack
              direction="row"
              spacing={tokens.semantic.spacing.xs / 8}
              sx={{ flexWrap: "wrap" }}
            >
              {onCourtPlayers.map((p) => (
                <Button
                  key={p.id}
                  variant="contained"
                  size="small"
                  onClick={() => onChainAction(p.id!, chainPrompt.type)}
                  aria-label={`#${jerseyMap.get(p.id!) ?? "??"} ${p.name}`}
                  sx={{
                    bgcolor: tokens.semantic.color.background.paper,
                    color: tokens.semantic.color.brand.primary.main,
                    fontWeight: tokens.typography.fontWeight.black,
                    fontSize: tokens.typography.fontSize.xs,
                    "&:hover": {
                      bgcolor: tokens.semantic.color.action.hover,
                    },
                  }}
                >
                  #{jerseyMap.get(p.id!) ?? "??"}
                </Button>
              ))}
            </Stack>
          </SurfaceCard>
        )}
      </>
    );
  },
);

LiveLineupCard.displayName = "LiveLineupCard";
