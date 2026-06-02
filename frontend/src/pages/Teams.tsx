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
import { alpha } from "@mui/material/styles";
import { useTeams } from "../hooks/useTeams";
import { getInitials } from "../utils/stats";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import PageSectionIntro from "../components/layout/PageSectionIntro";
import EntityStatCard from "../components/cards/EntityStatCard";
import CreateTeamWorkflow from "../components/teams/CreateTeamWorkflow";
import EmptyState from "../components/feedback/EmptyState";
import { useTeamsData } from "./Teams/hooks/useTeamsData";

type TeamTab = "all" | "favorites" | "archived";

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

  const { teamAggregatesMap, handleToggleFavorite } = useTeamsData({
    teams,
    setSnackbar,
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
            <EmptyState
              icon={<TeamsIcon sx={{ fontSize: 30 }} />}
              title={emptyStateTitle}
              description={emptyStateDescription}
              action={
                searchTerm ? (
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
                ) : null
              }
            />
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
                      description={
                        team.description?.trim() || "No description yet."
                      }
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
