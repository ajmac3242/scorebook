import React, { useMemo, useState } from "react";
import { Box, Button, Grid, Fab, useMediaQuery, useTheme } from "@mui/material";
import { Add as AddIcon, Groups as TeamsIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { getInitials } from "../utils/stats";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import { PageToolbar } from "../components/layout/PageToolbar";
import { EntityCard } from "../components/cards";
import CreateTeamWorkflow from "../components/teams/CreateTeamWorkflow";
import { EmptyState, PageSnackbar } from "../components/feedback";
import { useTeamsData } from "./Teams/hooks/useTeamsData";
import { usePageSnackbar } from "../hooks/usePageSnackbar";

type TeamTab = "all" | "favorites" | "archived";

const TABS: readonly AppPageTab<TeamTab>[] = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "archived", label: "Archived" },
] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const Teams: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const controlRadius = tokens.semantic.component.radius.button;
  const cardRadius = Math.max(tokens.semantic.component.sectionCard.radius, 20);

  // Derive default accent from the active theme preset so it always stays
  // in-family rather than being a hardcoded teal hex.
  const defaultTeamAccent = tokens.semantic.color.brand.primary.dark;

  const [activeTab, setActiveTab] = useState<TeamTab>("all");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const teams = useTeams();

  const { teamAggregatesMap, handleToggleFavorite } = useTeamsData({
    teams,
    showSnackbar,
  });

  const visibleTeams = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "favorites"
            ? Boolean(team.isFavorite)
            : false;

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        team.name,
        team.description || "",
        team.periodType || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeTab, teams, searchTerm]);

  const controls = (
    <PageToolbar
      id="teams-search"
      placeholder="Search teams"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Create team"
      onPrimaryClick={() => setWorkflowOpen(true)}
      controlRadius={controlRadius}
    />
  );

  return (
    <AppPageShell<TeamTab>
      title="Teams"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <Box sx={{ width: "100%" }}>
        {visibleTeams.length === 0 ? (
          <EmptyState
            icon={<TeamsIcon sx={{ fontSize: 40, color: "text.tertiary" }} />}
            title={
              searchTerm ? `No results for "${searchTerm}"` : "No teams yet"
            }
            description={
              searchTerm
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Start by creating your first team to track performance and manage rosters."
            }
            action={
              searchTerm ? (
                <Button
                  variant="outlined"
                  onClick={() => setSearchTerm("")}
                  sx={{
                    borderRadius: controlRadius,
                    textTransform: "none",
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setWorkflowOpen(true)}
                  sx={{
                    borderRadius: controlRadius,
                    textTransform: "none",
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                    boxShadow: "none",
                    px: `${tokens.semantic.spacing.md}px`,
                  }}
                >
                  Create first team
                </Button>
              )
            }
          />
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {visibleTeams.map((team) => {
              const aggregates = teamAggregatesMap[team.id!] || {
                record: "0-0",
                ppg: "0.0",
                rpg: "0.0",
                apg: "0.0",
                oppg: "0.0",
                gamesPlayed: 0,
              };

              const accentColor = isValidHex(team.primaryColor)
                ? team.primaryColor!.trim()
                : defaultTeamAccent;

              return (
                <Grid
                  size={{ xs: 12, md: 6, xl: 4 }}
                  key={team.id}
                  sx={{ display: "flex" }}
                >
                  <EntityCard
                    title={team.name}
                    subtitle={team.description}
                    accentColor={accentColor}
                    imageUrl={team.logoUrl}
                    fallbackInitials={getInitials(team.name)}
                    isFavorite={Boolean(team.isFavorite)}
                    favoriteTooltip={
                      team.isFavorite
                        ? "Remove from favorites"
                        : "Mark as favorite"
                    }
                    favoriteAriaLabel={
                      team.isFavorite
                        ? `Remove ${team.name} from favorites`
                        : `Mark ${team.name} as favorite`
                    }
                    onFavoriteClick={(event) =>
                      handleToggleFavorite(
                        team.id!,
                        team.isFavorite || 0,
                        event,
                      )
                    }
                    highlightValue={aggregates.record}
                    highlightLabel="Win-loss record"
                    stats={[
                      { label: "PPG", value: aggregates.ppg },
                      { label: "RPG", value: aggregates.rpg },
                      { label: "APG", value: aggregates.apg },
                      { label: "OPPG", value: aggregates.oppg },
                    ]}
                    ariaLabel={`View team dashboard for ${team.name}`}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/teams/${team.id}`);
                      }
                    }}
                    gamesPlayed={aggregates.gamesPlayed}
                    cardRadius={cardRadius}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="create team"
          onClick={() => setWorkflowOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            boxShadow: theme.shadows[6],
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <CreateTeamWorkflow
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        onCreated={() => {
          setWorkflowOpen(false);
          showSnackbar("Team created successfully!", "success");
        }}
      />
    </AppPageShell>
  );
};

export default Teams;
