import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  Groups as TeamsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { alpha } from "@mui/material/styles";
import { db, type StatEvent } from "../db";
import { useTeams } from "../hooks/useTeams";
import { logger } from "../utils/logger";
import { calculateTeamAggregates, getInitials } from "../utils/stats";
import { syncService } from "../utils/syncService";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import PageSectionIntro from "../components/layout/PageSectionIntro";
import EntityStatCard from "../components/cards/EntityStatCard";
import CreateTeamWorkflow from "../components/teams/CreateTeamWorkflow";

type TeamTab = "all" | "favorites" | "archived";

type TeamAggregateSummary = {
  record: string;
  ppg: string;
  rpg: string;
  apg: string;
  oppg: string;
};

const DEFAULT_TEAM_ACCENT = "#154C56";

const TABS: readonly AppPageTab<TeamTab>[] = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "archived", label: "Archived" },
] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const buildTeamAccent = (teamColor?: string) => {
  const safe = isValidHex(teamColor) ? teamColor!.trim() : DEFAULT_TEAM_ACCENT;
  return {
    solid: safe,
    softBg: alpha(safe, 0.12),
    softerBg: alpha(safe, 0.08),
    border: alpha(safe, 0.24),
    ring: alpha(safe, 0.18),
  };
};

const Teams: React.FC = () => {
  const tokens = useTokens();
  const navigate = useNavigate();

  const controlRadius = tokens.semantic.component.radius.button;
  const cardRadius = Math.max(tokens.semantic.component.sectionCard.radius, 20);
  const nestedRadius = Math.max(cardRadius - 6, 14);
  const logoRadius = Math.max(tokens.semantic.shape.radius.md, 14);

  const [activeTab, setActiveTab] = useState<TeamTab>("all");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const teams = useTeams();

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

  const teamIds = useMemo(
    () => teams.map((team) => team.id).filter(Boolean),
    [teams],
  );

  const allGamesQueryResult = useLiveQuery(() => {
    if (teamIds.length === 0) return [];
    return db.games.where("teamId").anyOf(teamIds as string[]).toArray();
  }, [teamIds]);

  const allGames = useMemo(() => allGamesQueryResult || [], [allGamesQueryResult]);

  const gameIds = useMemo(
    () => allGames.map((game) => game.id).filter(Boolean),
    [allGames],
  );

  const allStatsQueryResult = useLiveQuery(() => {
    if (gameIds.length === 0) return [];
    return db.stats.where("gameId").anyOf(gameIds as string[]).toArray();
  }, [gameIds]);

  const allStats = useMemo(() => allStatsQueryResult || [], [allStatsQueryResult]);

  const teamAggregatesMap = useMemo(() => {
    const gamesByTeam: Record<string, (typeof allGames)[0][]> = {};
    for (const game of allGames) {
      if (!gamesByTeam[game.teamId]) gamesByTeam[game.teamId] = [];
      gamesByTeam[game.teamId].push(game);
    }

    const statsByGame: Record<string, StatEvent[]> = {};
    for (const stat of allStats as StatEvent[]) {
      if (!statsByGame[stat.gameId]) statsByGame[stat.gameId] = [];
      statsByGame[stat.gameId].push(stat);
    }

    const results: Record<string, TeamAggregateSummary> = {};
    for (const team of teams) {
      const teamGames = gamesByTeam[team.id!] || [];
      const teamStats: StatEvent[] = teamGames.flatMap(
        (g) => statsByGame[g.id!] || [],
      );

      results[team.id!] = calculateTeamAggregates(
        teamGames,
        teamStats,
      ) as TeamAggregateSummary;
    }

    return results;
  }, [teams, allGames, allStats]);

  const handleToggleFavorite = async (
    teamId: string,
    currentFavorite: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      if (!currentFavorite) {
        const allFavorites = await db.teams
          .where("isFavorite")
          .equals(1)
          .toArray();

        for (const favoriteTeam of allFavorites) {
          if (favoriteTeam.id !== teamId) {
            await db.teams.update(favoriteTeam.id!, {
              isFavorite: 0,
              synced: 0,
            });
          }
        }

        await db.teams.update(teamId, { isFavorite: 1, synced: 0 });
      } else {
        await db.teams.update(teamId, { isFavorite: 0, synced: 0 });
      }

      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle favorite team", err, { teamId });
      setSnackbar({
        open: true,
        message: "Could not update favorite team",
        severity: "error",
      });
    }
  };

  const emptyStateTitle =
    activeTab === "archived"
      ? "No archived teams"
      : searchTerm
        ? `No teams matching "${searchTerm}"`
        : "No teams yet";

  const emptyStateDescription =
    activeTab === "archived"
      ? "Archived teams will appear here once that workflow is available."
      : searchTerm
        ? "Try a different search, clear the filter, or create a new team."
        : "Create your first team to start tracking performance, rosters, and game results.";

  const controls = (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        width: "100%",
      }}
    >
      <TextField
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search teams"
        size="small"
        fullWidth
        sx={{
          maxWidth: { xs: "100%", md: 360 },
          "& .MuiOutlinedInput-root": {
            borderRadius: controlRadius,
            bgcolor: "background.paper",
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setWorkflowOpen(true)}
        sx={{
          borderRadius: controlRadius,
          textTransform: "none",
          fontWeight: 600,
          boxShadow: "none",
          flexShrink: 0,
          minHeight: 36,
          alignSelf: { xs: "stretch", md: "center" },
        }}
      >
        Add team
      </Button>
    </Stack>
  );

  return (
    <AppPageShell<TeamTab>
      title="Teams"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
    >
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <PageSectionCard>
        <Box sx={{ p: { xs: 2.5, md: 0 } }}>
          <PageSectionIntro
            title={
              activeTab === "all"
                ? "All teams"
                : activeTab === "favorites"
                  ? "Favorite team"
                  : "Archived teams"
            }
            description={
              activeTab === "all"
                ? "Review team performance, manage favorites, and open team dashboards."
                : activeTab === "favorites"
                  ? "Quick access to the team pinned for your dashboard workflow."
                  : "Archived teams will appear here once that workflow is supported."
            }
          />

          {visibleTeams.length === 0 ? (
            <Box
              sx={{
                minHeight: 300,
                borderRadius: `${cardRadius}px`,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 3,
                py: 6,
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                    color: "text.secondary",
                  }}
                >
                  <TeamsIcon sx={{ fontSize: 30 }} />
                </Box>

                <Box
                  component="p"
                  sx={{
                    m: 0,
                    mb: 1,
                    fontSize: (theme) => theme.typography.body1.fontSize,
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  {emptyStateTitle}
                </Box>

                <Box
                  component="p"
                  sx={{
                    m: 0,
                    color: "text.secondary",
                    lineHeight: 1.6,
                    maxWidth: 480,
                    mx: "auto",
                    mb: 2.5,
                  }}
                >
                  {emptyStateDescription}
                </Box>

                {searchTerm ? (
                  <Button
                    variant="outlined"
                    onClick={() => setSearchTerm("")}
                    sx={{
                      borderRadius: controlRadius,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Clear search
                  </Button>
                ) : activeTab !== "archived" ? (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setWorkflowOpen(true)}
                    sx={{
                      borderRadius: controlRadius,
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "none",
                    }}
                  >
                    Create first team
                  </Button>
                ) : null}
              </Box>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {visibleTeams.map((team) => {
                const aggregates = teamAggregatesMap[team.id!] || {
                  record: "0-0",
                  ppg: "0.0",
                  rpg: "0.0",
                  apg: "0.0",
                  oppg: "0.0",
                };

                const accent = buildTeamAccent(team.primaryColor);

                return (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={team.id}>
                    <EntityStatCard
                      title={team.name}
                      description={team.description?.trim() || "No description yet."}
                      badgeLabel={
                        team.periodType === "HALVES" ? "Halves" : "Quarters"
                      }
                      accentColor={accent.solid}
                      accentSoftBg={accent.softBg}
                      accentSofterBg={accent.softerBg}
                      accentBorder={accent.border}
                      accentRing={accent.ring}
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
                      recordValue={aggregates.record}
                      recordLabel="Win-loss record"
                      stats={[
                        { label: "PPG", value: aggregates.ppg },
                        { label: "RPG", value: aggregates.rpg },
                        { label: "APG", value: aggregates.apg },
                        { label: "OPPG", value: aggregates.oppg },
                      ]}
                      footerLabel="Open team dashboard"
                      ariaLabel={`View team dashboard for ${team.name}`}
                      onClick={() => navigate(`/teams/${team.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/teams/${team.id}`);
                        }
                      }}
                      cardRadius={cardRadius}
                      nestedRadius={nestedRadius}
                      logoRadius={logoRadius}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </PageSectionCard>

      <CreateTeamWorkflow
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        onCreated={() => {
          setWorkflowOpen(false);
          setSnackbar({
            open: true,
            message: "Team created successfully!",
            severity: "success",
          });
        }}
      />
    </AppPageShell>
  );
};

export default Teams;