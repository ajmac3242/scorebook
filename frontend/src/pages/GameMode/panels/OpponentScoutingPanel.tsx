import React from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Button,
  Grid,
} from "@mui/material";
import { LocalFireDepartment, Gavel } from "@mui/icons-material";
import { MoleskineCard } from "../../../components/SharedUI";
import { useMatchupAssignment } from "../hooks/useMatchupAssignment";
import type { OpponentStat } from "../types";
import type { Player, Game } from "../../../db";

type OpponentScoutingPanelProps = {
  opponentStats: OpponentStat[];
  game: Game | undefined;
  players: Player[];
  draftOnCourtIds: Set<string>;
  jerseyMap: Map<string, string>;
  matchups: Record<string, string>;
  gameId: string | null;
};

export const OpponentScoutingPanel: React.FC<OpponentScoutingPanelProps> = ({
  opponentStats,
  game,
  players,
  draftOnCourtIds,
  jerseyMap,
  matchups,
  gameId,
}) => {
  const { handleAssignDefender } = useMatchupAssignment({ gameId, game });

  return (
    <Box sx={{ mb: 3 }}>
      <MoleskineCard title="Opponent Scouting">
        <Stack spacing={2}>
          {opponentStats.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic", p: 2 }}
            >
              No opponent data recorded yet...
            </Typography>
          ) : (
            opponentStats.map((stat) => (
              <OpponentPlayerCard
                key={stat.jersey}
                stat={stat}
                players={players}
                draftOnCourtIds={draftOnCourtIds}
                jerseyMap={jerseyMap}
                matchups={matchups}
                onAssignDefender={handleAssignDefender}
              />
            ))
          )}
        </Stack>
      </MoleskineCard>
    </Box>
  );
};

const OpponentPlayerCard = ({
  stat,
  players,
  draftOnCourtIds,
  jerseyMap,
  matchups,
  onAssignDefender,
}: {
  stat: OpponentStat;
  players: Player[];
  draftOnCourtIds: Set<string>;
  jerseyMap: Map<string, string>;
  matchups: Record<string, string>;
  onAssignDefender: (_opponentId: string, _playerId: string) => void;
}) => {
  const currentDefenderId = matchups[stat.jersey];

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid var(--cs-semantic-color-border-subtle)",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: "var(--cs-semantic-color-feedback-error-main)",
            fontWeight: 900,
            width: 32,
            height: 32,
            fontSize: "var(--cs-typography-fontSize-xs)",
          }}
        >
          {stat.jersey}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              #{stat.jersey}
            </Typography>
            {stat.isHot && (
              <Chip
                icon={
                  <LocalFireDepartment sx={{ fontSize: "1rem !important" }} />
                }
                label="HOT"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  bgcolor: "var(--cs-semantic-color-feedback-error-subtle)",
                  color: "var(--cs-semantic-color-feedback-error-main)",
                }}
              />
            )}
            {stat.isClutchThreat && (
              <Chip
                icon={<Gavel sx={{ fontSize: "1rem !important" }} />}
                label="CLUTCH"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  bgcolor: "var(--cs-semantic-color-feedback-warning-subtle)",
                  color: "var(--cs-semantic-color-feedback-warning-main)",
                }}
              />
            )}
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            {stat.points} PTS • {stat.fgm}/{stat.fga} FG • {stat.turnovers} TO
          </Typography>
        </Box>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: 1,
          fontWeight: 800,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        Defensive Assignment
      </Typography>
      <Grid container spacing={0.5}>
        {players
          .filter((p) => draftOnCourtIds.has(p.id!))
          .map((p) => (
            <Grid key={p.id} sx={{ width: "20%" }}>
              <Button
                fullWidth
                variant={currentDefenderId === p.id ? "contained" : "outlined"}
                size="small"
                onClick={() => onAssignDefender(stat.jersey, p.id!)}
                sx={{
                  minWidth: 0,
                  p: 0,
                  height: 24,
                  fontWeight: 800,
                  fontSize: "var(--cs-typography-fontSize-xs)",
                }}
              >
                {jerseyMap.get(p.id!) || "??"}
              </Button>
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};
