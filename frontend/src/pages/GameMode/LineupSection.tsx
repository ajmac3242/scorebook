import React from "react";
import { Box, Typography, Button, Avatar, IconButton } from "@mui/material";
import { History } from "@mui/icons-material";
import { MoleskineCard } from "../../components/SharedUI";
import { formatClock, formatPlusMinus } from "../../utils/mathUtils";
import { pulse } from "../../styles/animations";
import { LineupPlayerButton } from "./GameModeComponents";
import { Player, Team, Game, StatEvent } from "../../db";
import { PlayerAggregates, GameAnalyticsContext } from "../../utils/stats";

interface LineupSectionProps {
  gameData: GameAnalyticsContext;
  players: Player[];
  statsMap: Map<string, PlayerAggregates>;
  jerseyMap: Map<string, string | undefined>;
  isReadOnly: boolean;
  period: number;
  game: Game | null;
  team: Team | null;
  playerStreaks: Map<string, "HOT" | "COLD" | null | undefined>;
  handleLineupPlayerClick: (_playerId: string) => void;
  setSubOutPlayerId: (_id: string | null) => void;
  setIsSubDialogOpen: (_open: boolean) => void;
  chainPrompt: { type: "ASSIST" | "REBOUND"; originalStat: StatEvent } | null;
  setChainPrompt: (
    _prompt: { type: "ASSIST" | "REBOUND"; originalStat: StatEvent } | null,
  ) => void;
  handleChainAction: (_playerId: string, _type: string) => void;
}

export const LineupSection: React.FC<LineupSectionProps> = ({
  gameData,
  players,
  statsMap,
  jerseyMap,
  isReadOnly,
  period,
  game,
  team,
  playerStreaks,
  handleLineupPlayerClick,
  setSubOutPlayerId,
  setIsSubDialogOpen,
  chainPrompt,
  setChainPrompt,
  handleChainAction,
}) => {
  return (
    <>
      <MoleskineCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.55rem",
                fontWeight: 800,
                textTransform: "uppercase",
                display: "block",
                color: "text.secondary",
              }}
            >
              Current Lineup
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {formatClock(gameData.currentLineupStintDuration as number)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="h6"
              data-testid="lineup-plus-minus"
              sx={{
                fontWeight: 900,
                color:
                  (gameData.currentLineupPlusMinus as number) >= 0
                    ? "success.main"
                    : "error.main",
                lineHeight: 1,
                fontSize: "1.2rem",
              }}
            >
              {formatPlusMinus(gameData.currentLineupPlusMinus as number)}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.55rem",
                fontWeight: 800,
                textTransform: "uppercase",
                opacity: 0.6,
              }}
            >
              Net Impact
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 1,
          }}
        >
          {players
            .filter((p) => gameData.onCourtIds.has(p.id!))
            .map((p) => (
              <LineupPlayerButton
                key={p.id}
                player={p}
                stats={statsMap.get(p.id!)}
                jerseyNumber={jerseyMap.get(p.id!) || ""}
                isReadOnly={isReadOnly}
                period={period}
                game={game}
                team={team}
                stintSecs={gameData.stintDurations.get(p.id!) || 0}
                periodFouls={gameData.onCourtPeriodFouls.get(p.id!) || 0}
                streak={playerStreaks.get(p.id!)}
                onClick={handleLineupPlayerClick}
              />
            ))}
          {Array.from({
            length: Math.max(0, 5 - gameData.onCourtIds.size),
          }).map((_, i) => {
            const emptyId = "EMPTY-" + i;
            return (
              <Button
                key={emptyId}
                variant="outlined"
                disabled={isReadOnly}
                aria-label={
                  "Empty lineup slot " + (i + 1) + ", click to assign player"
                }
                onClick={() => {
                  setSubOutPlayerId(emptyId);
                  setIsSubDialogOpen(true);
                }}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  borderStyle: "dashed",
                  color: "text.secondary",
                  px: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 20,
                    height: 20,
                    fontSize: "0.65rem",
                    mr: 1,
                    bgcolor: "transparent",
                    border: "1px dashed #ccc",
                    color: "text.secondary",
                  }}
                >
                  +
                </Avatar>
                <Typography variant="caption">Empty Slot</Typography>
              </Button>
            );
          })}
        </Box>
      </MoleskineCard>

      {chainPrompt && (
        <MoleskineCard
          sx={{
            bgcolor: "primary.light",
            color: "primary.contrastText",
            animation: pulse + " 2s infinite ease-in-out",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              WHO GOT THE {chainPrompt.type}?
            </Typography>
            <IconButton
              size="small"
              onClick={() => setChainPrompt(null)}
              sx={{ color: "white" }}
            >
              <History fontSize="small" />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
            }}
          >
            {players
              .filter((p) => gameData.onCourtIds.has(p.id!))
              .map((p) => (
                <Button
                  key={p.id}
                  variant="contained"
                  size="small"
                  onClick={() => handleChainAction(p.id!, chainPrompt.type)}
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
          </Box>
        </MoleskineCard>
      )}
    </>
  );
};
