/**
 * @file LiveLineupCard.tsx
 * @description Live on-court lineup display with stint timer, plus/minus,
 * player buttons, empty slot placeholders, and chain action prompt.
 */
import React from "react";
import { Box, Typography, Stack, Button, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { SurfaceCard } from "../../components/SharedUI";
import { LineupPlayerButton } from "./GameModeComponents";
import { type Player, type Game, type Team, type StatEvent } from "../../db";
import {
  type PlayerAggregates,
  type NeuralLoadData,
  type PredictabilityData,
  type VerbalVelocityData,
} from "../../utils/stats";
import { formatClock, formatPlusMinus } from "../../utils/mathUtils";

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
  neuralLoad?: NeuralLoadData;
  predictability?: PredictabilityData;
  verbalVelocity?: VerbalVelocityData;
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
    neuralLoad,
    predictability,
    verbalVelocity,
    onPlayerClick,
    onEmptySlotClick,
    onChainAction,
    onDismissChain,
  }) => {
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
              mb: 1,
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              Live Lineup
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="caption" color="text.secondary">
                {`STINT: `}
                <Box
                  component="span"
                  sx={{ fontWeight: 700 }}
                >
                  {formatClock(currentLineupStintDuration)}
                </Box>
              </Typography>
              <Typography
                variant="body2"
                data-testid="lineup-plus-minus"
                sx={{
                  fontWeight: 800,
                  color:
                    currentLineupPlusMinus >= 0 ? "success.main" : "error.main",
                  lineHeight: 1,
                  fontSize: "1.2rem",
                }}
              >
                {formatPlusMinus(currentLineupPlusMinus)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
                jerseyNumber={jerseyMap.get(p.id!) ?? "?"}
                isReadOnly={isReadOnly}
                period={period}
                game={game}
                team={team}
                stintSecs={stintDurations?.get(p.id!) ?? 0}
                periodFouls={periodFoulMap?.get(p.id!) ?? 0}
                streak={playerStreaks?.get(p.id!)}
                neuralLoad={neuralLoad?.playerLoads[p.id!]}
                onClick={onPlayerClick}
              />
            ))}

            {(predictability ||
              verbalVelocity ||
              (neuralLoad && neuralLoad.unitSpm > 0)) && (
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  mt: 1,
                  px: 1,
                  py: 0.5,
                  bgcolor: "rgba(0,0,0,0.05)",
                  borderRadius: 1,
                }}
              >
                {neuralLoad && neuralLoad.unitSpm > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.6rem", display: "block" }}
                    >
                      UNIT SPM
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color:
                          neuralLoad.unitSpm > 1.5 ? "error.main" : "inherit",
                      }}
                    >
                      {neuralLoad.unitSpm.toFixed(1)}
                    </Typography>
                  </Box>
                )}
                {predictability && predictability.score > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.6rem", display: "block" }}
                    >
                      PREDICTABILITY
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color:
                          predictability.score > 70
                            ? "warning.main"
                            : "inherit",
                      }}
                    >
                      {predictability.score}%
                    </Typography>
                  </Box>
                )}
                {verbalVelocity && verbalVelocity.latency > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.6rem", display: "block" }}
                    >
                      VERBAL VELO
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color:
                          verbalVelocity.latency > 0.4
                            ? "warning.main"
                            : "inherit",
                      }}
                    >
                      {verbalVelocity.latency}s
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {Array.from({ length: emptySlotCount }).map((_, i) => {
              const emptyId = `EMPTY-${i}`;
              return (
                <Button
                  key={emptyId}
                  aria-label="Empty lineup slot"
                  onClick={() => onEmptySlotClick(emptyId)}
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    borderStyle: "dashed",
                    color: "text.secondary",
                    px: 1,
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
            sx={{ bgcolor: "primary.main", color: "white" }}
            aria-label="Chain action prompt"
          >
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontWeight: 800, color: "white" }}
              >
                WHO GOT THE {chainPrompt.type}?
              </Typography>
              <IconButton
                size="small"
                onClick={onDismissChain}
                sx={{ color: "white" }}
                aria-label="Dismiss chain action"
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {onCourtPlayers.map((p) => (
                <Button
                  key={p.id}
                  variant="contained"
                  size="small"
                  onClick={() => onChainAction(p.id!, chainPrompt.type)}
                  aria-label={`#${jerseyMap.get(p.id!)} ${p.name}`}
                  sx={{
                    bgcolor: "white",
                    color: "primary.main",
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
                  }}
                >
                  #{jerseyMap.get(p.id!)}
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
