import React, { useMemo, useState } from "react";
import { Box, Button } from "@mui/material";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { type Player, type Team } from "../../../db";
import { PlayerAggregates } from "../../../utils/stats/types";
import { getInitials } from "../../../utils/stats";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import ActionBar from "../../../components/layout/ActionBar";
import { EntityCard } from "../../../components/cards";
import EmptyState from "../../../components/feedback/EmptyState";

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

const formatOneDecimal = (value: number | undefined) =>
  typeof value === "number" ? value.toFixed(1) : "0.0";

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
  const [searchTerm, setSearchTerm] = useState("");

  const displayRoster = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedRoster;
    return sortedRoster.filter((player) => {
      const jersey = sortedRosterJerseyMap.get(player.id!) ?? "";
      return (
        player.name.toLowerCase().includes(term) ||
        jersey.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, sortedRoster, sortedRosterJerseyMap]);

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <ActionBar
          searchPlaceholder="Search roster"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          actionLabel="Manage roster"
          actionAriaLabel="Manage roster"
          onActionClick={onManageRoster}
          actionIcon={<PersonAddIcon />}
          actionDisabled={isDeleted}
          controlRadius={controlRadius}
        />

        {displayRoster.length === 0 ? (
          <EmptyState
            icon={<PersonAddIcon sx={{ fontSize: 30 }} />}
            title={
              searchTerm
                ? `No results for "${searchTerm}"`
                : "No players on this roster"
            }
            description={
              searchTerm
                ? "Try adjusting your search to find a player on this roster."
                : "Add players to this team to start tracking minutes, production, and lineup data."
            }
            action={
              !isDeleted && !searchTerm ? (
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
              gap: 2,
            }}
          >
            {displayRoster.map((player: Player) => {
              const jersey = sortedRosterJerseyMap.get(player.id!) ?? "—";
              const playerAggregate = aggregatedStats.find(
                (s) => s.id === player.id,
              );
              const gp = playerAggregate?.gp ?? 0;
              const points = playerAggregate?.points ?? 0;
              const rebounds = playerAggregate?.rebounds ?? 0;
              const assists = playerAggregate?.assists ?? 0;

              return (
                <EntityCard
                  key={player.id}
                  title={player.name}
                  subtitle={
                    gp > 0
                      ? `#${jersey} · ${gp} GP`
                      : `#${jersey} · No games tracked yet`
                  }
                  accentColor={team?.primaryColor || DEFAULT_TEAM_ACCENT}
                  fallbackInitials={getInitials(player.name)}
                  badgeLabel={jersey !== "—" ? `#${jersey}` : undefined}
                  imageUrl={undefined}
                  highlightValue={formatOneDecimal(points)}
                  highlightLabel="PPG"
                  stats={[
                    { label: "RPG", value: formatOneDecimal(rebounds) },
                    { label: "APG", value: formatOneDecimal(assists) },
                    { label: "GP", value: String(gp) },
                  ]}
                  ariaLabel={`Open ${player.name}'s player dashboard`}
                  onClick={() =>
                    navigate(`/players/${player.id}?teamId=${teamId}`)
                  }
                  gamesPlayed={gp}
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
