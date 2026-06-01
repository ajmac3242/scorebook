import React from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Button,
  Alert,
} from "@mui/material";
import { MoleskineCard } from "../../../components/SharedUI";
import type { OpponentStat } from "../../../hooks/useGameMode";
import type { Game, Player } from "../../../db";

type OpponentScoutingPanelProps = {
  opponentStats: OpponentStat[];
  game: Game | undefined;
  players: Player[];
  draftOnCourtIds: Set<string>;
  jerseyMap: Map<string, string>;
  matchups: Record<string, string>;
  gameId: string;
  onAssignDefender: (opponentId: string, playerId: string) => Promise<void>;
};

export const OpponentScoutingPanel: React.FC<OpponentScoutingPanelProps> = ({
  opponentStats,
  game,
  players,
  draftOnCourtIds,
  jerseyMap,
  matchups,
  onAssignDefender,
}) => {
  return (
    <MoleskineCard>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        {game?.opponent || "Opponent"} Scouting
      </Typography>
      {opponentStats.length > 0 ? (
        opponentStats.map((opp) => (
          <Box
            key={opp.id}
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 1, alignItems: "center" }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "var(--cs-typography-fontSize-xs)",
                  bgcolor: opp.isHot
                    ? "var(--cs-semantic-color-feedback-error-main)"
                    : "var(--cs-semantic-color-brand-primary-main)",
                }}
              >
                {opp.jersey}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 800, display: "block" }}
                >
                  Opponent #{opp.jersey}
                  {opp.isHot && <span style={{ marginLeft: 4 }}>🔥</span>}
                  {opp.isClutchThreat && (
                    <Chip
                      label="CLUTCH"
                      size="small"
                      sx={{
                        ml: 0.5,
                        height: 16,
                        fontSize: "var(--cs-typography-fontSize-xs)",
                        bgcolor: "var(--cs-semantic-color-feedback-error-main)",
                        color: "white",
                      }}
                    />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {opp.points} pts | {opp.makes}-{opp.attempts} FG |{" "}
                  {opp.turnovers} TO
                </Typography>
                {opp.straightPoints >= 4 && (
                  <Chip
                    label={`${opp.straightPoints}-0 RUN`}
                    size="small"
                    sx={{
                      ml: 0.5,
                      height: 16,
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      bgcolor: "var(--cs-semantic-color-feedback-warning-main)",
                      color: "black",
                    }}
                  />
                )}
              </Box>
            </Stack>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
            >
              Primary Defender
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
              {players
                .filter((p) => draftOnCourtIds.has(p.id!))
                .map((p) => (
                  <Button
                    key={p.id}
                    variant={matchups[opp.id] === p.id ? "contained" : "outlined"}
                    size="small"
                    onClick={() => onAssignDefender(opp.id, p.id!)}
                    sx={{
                      minWidth: 0,
                      p: 0.5,
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      fontWeight: 700,
                      height: 24,
                    }}
                  >
                    #{jerseyMap.get(p.id!)}
                  </Button>
                ))}
            </Stack>
          </Box>
        ))
      ) : (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            No opponent players tracked yet.
          </Typography>
          <Alert
            severity="info"
            sx={{
              textAlign: "left",
              fontSize: "var(--cs-typography-fontSize-xs)",
            }}
          >
            <strong>QUICK TIP</strong> — Tap the court in Opponent mode to
            record stats for specific jersey numbers.
          </Alert>
        </Box>
      )}
    </MoleskineCard>
  );
};
