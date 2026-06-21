import React, { useMemo, useState } from "react";
import { Box, Button, Grid, useMediaQuery, useTheme } from "@mui/material";
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

type TeamTab = "active" | "archived";

const TABS: readonly AppPageTab<TeamTab>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const Teams: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const defaultTeamAccent = tokens.semantic.color.brand.primary.dark;

  const [activeTab, setActiveTab] = useState<TeamTab>("active");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const teams = useTeams();

  const { teamAggregatesMap, handleToggleDefault } = useTeamsData({
    teams,
    showSnackbar,
  });

  const visibleTeams = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = teams.filter((team) => {
      const matchesTab =
        activeTab === "active" ? !team.isArchived : Boolean(team.isArchived);

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

    // Default team always sorts first within the Active tab
    if (activeTab === "active") {
      filtered.sort((a, b) => {
        const aDefault = Boolean(a.isFavorite);
        const bDefault = Boolean(b.isFavorite);
        if (aDefault && !bDefault) return -1;
        if (!aDefault && bDefault) return 1;
        return 0;
      });
    }

    return filtered;
  }, [activeTab, teams, searchTerm]);

  const controls = (
    <PageToolbar
      id="teams-search"
      placeholder="Search teams"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Create team"
      onPrimaryClick={() => setWorkflowOpen(true)}
      primaryDisabled={isMobile}
    />
  );

  return (
    <AppPageShell<TeamTab>
      title="Teams"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
      fabProps={{
        icon: <AddIcon />,
        "aria-label": "create team",
        onClick: () => setWorkflowOpen(true),
      }}
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <Box sx={{ width: "100%" }}>
        {visibleTeams.length === 0 ? (
          <EmptyState
            icon={
              <TeamsIcon
                sx={{
                  fontSize: tokens.semantic.component.iconSize.xl,
                  color: "text.tertiary",
                }}
              />
            }
            title={
              searchTerm
                ? `No results for "${searchTerm}"`
                : activeTab === "active"
                  ? "No active teams"
                  : "No archived teams"
            }
            description={
              searchTerm
                ? "Try adjusting your search or filters to find what you're looking for."
                : activeTab === "active"
                  ? "Start by creating your first team to track performance and manage rosters."
                  : "Teams you archive will appear here."
            }
            action={
              searchTerm ? (
                <Button variant="outlined" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              ) : activeTab === "active" ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setWorkflowOpen(true)}
                  sx={{
                    px: `${tokens.semantic.spacing.md}px`,
                  }}
                >
                  Create first team
                </Button>
              ) : null
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

              const isDefault = Boolean(team.isFavorite);

              return (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={team.id}>
                  <EntityCard
                    title={team.name}
                    subtitle={team.description}
                    accentColor={accentColor}
                    imageUrl={team.logoUrl}
                    fallbackInitials={getInitials(team.name)}
                    isFavorite={isDefault}
                    favoriteTooltip={
                      isDefault
                        ? "Default team — tap to unset"
                        : "Set as default team"
                    }
                    favoriteAriaLabel={
                      isDefault
                        ? `${team.name} is your default team. Tap to unset.`
                        : `Set ${team.name} as your default team`
                    }
                    onFavoriteClick={(event) =>
                      handleToggleDefault(team.id!, team.isFavorite || 0, event)
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
                    gamesPlayed={aggregates.gamesPlayed}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

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
