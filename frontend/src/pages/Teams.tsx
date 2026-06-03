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
  Chip,
  Fab,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Groups as TeamsIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { getInitials } from "../utils/stats";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import { EntityCard } from "../components/cards";
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

const Teams: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const controlRadius = tokens.semantic.component.radius.button;
  const cardRadius = Math.max(tokens.semantic.component.sectionCard.radius, 20);

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

  const activeFiltersCount =
    (searchTerm ? 1 : 0) + (activeTab !== "all" ? 1 : 0);

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
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      {!isMobile && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setWorkflowOpen(true)}
          sx={{
            borderRadius: controlRadius,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            flexShrink: 0,
            px: 3,
            minHeight: 40,
            alignSelf: { xs: "stretch", md: "center" },
          }}
        >
          Add team
        </Button>
      )}
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
        anchorOrigin={{
          vertical: isMobile ? "top" : "bottom",
          horizontal: "center",
        }}
        sx={{
          mb: isMobile ? 0 : 8,
          mt: isMobile ? 7 : 0,
        }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ width: "100%" }}>
        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}
          >
            {searchTerm && (
              <Chip
                label={`Search: ${searchTerm}`}
                onDelete={() => setSearchTerm("")}
                size="small"
                sx={{ borderRadius: 1.5, fontWeight: 600 }}
              />
            )}
            {activeTab !== "all" && (
              <Chip
                label={`View: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                onDelete={() => setActiveTab("all")}
                size="small"
                sx={{ borderRadius: 1.5, fontWeight: 600 }}
              />
            )}
          </Stack>
        )}

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
                    fontWeight: 600,
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
                    fontWeight: 700,
                    boxShadow: "none",
                    px: 3,
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
                : DEFAULT_TEAM_ACCENT;

              return (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={team.id}>
                  <EntityCard
                    title={team.name}
                    subtitle={team.description}
                    badgeLabel={
                      team.periodType === "HALVES" ? "Halves" : "Quarters"
                    }
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
                    footerLabel="Team Dashboard"
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
          aria-label="add team"
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
