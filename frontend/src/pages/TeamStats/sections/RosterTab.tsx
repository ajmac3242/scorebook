import React from "react";
import {
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { type Player, type Team } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats/types";
import { getInitials } from "../../../utils/stats";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import PageSectionIntro from "../../../components/layout/PageSectionIntro";
import EntityRowCard from "../../../components/cards/EntityRowCard";
import EmptyState from "../../../components/EmptyState";

type RosterTabProps = {
  sortedRoster: Player[];
  sortedRosterJerseyMap: Map<string, string>;
  aggregatedStats: PlayerAggregates[];
  isDeleted: boolean;
  teamId: string | undefined;
  team: Team | undefined;
  controlRadius: number;
  onManageRoster: () => void;
};

const DEFAULT_TEAM_ACCENT = "#154C56";

const RosterTab: React.FC<RosterTabProps> = ({
  sortedRoster,
  sortedRosterJerseyMap,
  aggregatedStats,
  isDeleted,
  teamId,
  team,
  controlRadius,
  onManageRoster,
}) => {
  const navigate = useNavigate();
  const sectionPadding = { xs: 2.5, md: 0 };

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Team roster"
            description="Manage player assignments and open individual player dashboards."
          />
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            mb: 3,
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box />
          <Button
            variant="contained"
            disabled={isDeleted}
            startIcon={<PersonAddIcon />}
            onClick={onManageRoster}
            sx={{
              borderRadius: `${controlRadius}px`,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              minHeight: 36,
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            Manage roster
          </Button>
        </Stack>

        {sortedRoster.length === 0 ? (
          <EmptyState
            icon={<PersonAddIcon sx={{ fontSize: 30 }} />}
            title="No players on this roster"
            description="Add players to this team to start tracking minutes, production, and lineup data."
            action={
              !isDeleted ? (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={onManageRoster}
                  sx={{
                    borderRadius: `${controlRadius}px`,
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  Add players
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fill, minmax(280px, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {sortedRoster.map((player) => {
              const jersey = sortedRosterJerseyMap.get(player.id!) ?? "";
              const playerAggregate = aggregatedStats.find((s) => s.id === player.id);
              const gp = playerAggregate?.gp ?? 0;
              const pts = playerAggregate?.points ?? 0;

              return (
                <EntityRowCard
                  key={player.id}
                  accentColor={team?.primaryColor || DEFAULT_TEAM_ACCENT}
                  leading={
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignItems: "center" }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "var(--cs-typography-fontSize-lg)",
                          color: "text.disabled",
                          minWidth: 26,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {jersey || "—"}
                      </Typography>
                      <Avatar
                        sx={{
                          bgcolor: player.avatarColor,
                          width: 40,
                          height: 40,
                          fontSize: "var(--cs-typography-fontSize-sm)",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(player.name)}
                      </Avatar>
                    </Stack>
                  }
                  title={player.name}
                  subtitle={gp > 0 ? `${gp} GP · ${pts} PTS` : "No games tracked yet"}
                  onClick={() => navigate(`/players/${player.id}?teamId=${teamId}`)}
                  ariaLabel={`Open ${player.name}'s player dashboard`}
                />
              );
            })}
          </Box>
        )}
      </Box>
    </PageSectionCard>
  );
};

export default RosterTab;
