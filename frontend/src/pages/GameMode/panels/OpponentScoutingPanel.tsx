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
import { LocalFireDepartment, Gavel, PeopleAlt } from "@mui/icons-material";
import { SurfaceCard } from "../../../components/cards/SurfaceCard";
import { useMatchupAssignment } from "../hooks/useMatchupAssignment";
import type { OpponentStat } from "../types";
import type { Player, Game } from "../../../db";
import { useTokens } from "../../../theme/useTokens";
import { EmptyState } from "../../../components/feedback";

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
  const tokens = useTokens();
  const { handleAssignDefender } = useMatchupAssignment({ gameId, game });

  return (
    <Box sx={{ mb: tokens.semantic.spacing.lg / 8 }}>
      <SurfaceCard title="Opponent Scouting">
        <Stack spacing={tokens.semantic.spacing.md / 8}>
          {opponentStats.length === 0 ? (
            <EmptyState
              icon={
                <PeopleAlt sx={{ fontSize: tokens.spacing[8] / 8 }} /> // 30px -> ~32px (spacing[8])
              }
              title="No opponent data recorded yet"
              description="Start recording actions for opponent jerseys to see scouting data and assign defenders."
            />
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
      </SurfaceCard>
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
  const tokens = useTokens();
  const currentDefenderId = matchups[stat.jersey];

  return (
    <Box
      sx={{
        p: tokens.semantic.spacing.md / 8,
        borderRadius: tokens.semantic.shape.radius.md / 8,
        border: "1px solid",
        borderColor: tokens.semantic.color.border.subtle,
        transition: `border-color ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
        "&:hover": { borderColor: tokens.semantic.color.brand.primary.main },
      }}
    >
      <Stack
        direction="row"
        spacing={tokens.semantic.spacing.md / 8}
        sx={{ alignItems: "center", mb: tokens.semantic.spacing.sm / 8 }}
      >
        <Avatar
          sx={{
            bgcolor: tokens.semantic.color.feedback.error.main,
            fontWeight: tokens.typography.fontWeight.bold,
            width: 32,
            height: 32,
            fontSize: tokens.typography.fontSize.xs,
          }}
        >
          {stat.jersey}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Stack
            direction="row"
            spacing={tokens.semantic.spacing.xs / 8}
            sx={{ alignItems: "center" }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: tokens.typography.fontWeight.bold }}
            >
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
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  bgcolor: tokens.semantic.color.feedback.error.light,
                  color: tokens.semantic.color.feedback.error.main,
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
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.bold,
                  bgcolor: tokens.semantic.color.feedback.warning.light,
                  color: tokens.semantic.color.feedback.warning.main,
                }}
              />
            )}
          </Stack>
          <Typography
            variant="caption"
            sx={{
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.semantic.color.text.secondary,
            }}
          >
            {stat.points} PTS • {stat.fgm}/{stat.fga} FG • {stat.turnovers} TO •{" "}
            {stat.fouls} PF
          </Typography>
        </Box>
      </Stack>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          mb: tokens.semantic.spacing.xs / 8,
          fontWeight: tokens.typography.fontWeight.bold,
          textTransform: "uppercase",
          color: tokens.semantic.color.text.secondary,
        }}
      >
        Defensive Assignment
      </Typography>
      <Grid container spacing={tokens.semantic.spacing.xs / 16}>
        {players
          .filter((p) => draftOnCourtIds.has(p.id!))
          .map((p) => {
            const playerJersey = jerseyMap.get(p.id!) ?? "??";

            return (
              <Grid key={p.id} sx={{ width: "20%" }}>
                <Button
                  fullWidth
                  variant={
                    currentDefenderId === p.id ? "contained" : "outlined"
                  }
                  size="small"
                  aria-label={`Assign #${playerJersey} to defend Opponent #${stat.jersey}`}
                  onClick={() => onAssignDefender(stat.jersey, p.id!)}
                  sx={{
                    minWidth: 0,
                    p: 0,
                    height: 24,
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  {playerJersey}
                </Button>
              </Grid>
            );
          })}
      </Grid>
    </Box>
  );
};
