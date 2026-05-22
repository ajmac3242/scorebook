import React, { useMemo, useState } from "react";
import {
  Add as AddIcon,
  MoreHoriz as MoreHorizIcon,
  PushPin as DefaultIcon,
  Search as SearchIcon,
  Star as StarFilledIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import PageSectionIntro from "../components/layout/PageSectionIntro";

type TeamTab = "all" | "starred" | "archived";

type TeamRecord = {
  id: string;
  name: string;
  season: string;
  level: string;
  record: string;
  players: number;
  games: number;
  isStarred: boolean;
  isDefault: boolean;
  isArchived: boolean;
  updatedLabel: string;
};

const TABS: readonly AppPageTab<TeamTab>[] = [
  { value: "all", label: "All" },
  { value: "starred", label: "Starred" },
  { value: "archived", label: "Archived" },
] as const;

const MOCK_TEAMS: readonly TeamRecord[] = [
  {
    id: "1",
    name: "Brookfield Central Varsity",
    season: "2025–26",
    level: "Varsity",
    record: "18–4",
    players: 12,
    games: 22,
    isStarred: true,
    isDefault: true,
    isArchived: false,
    updatedLabel: "Updated 2h ago",
  },
  {
    id: "2",
    name: "Brookfield Central JV",
    season: "2025–26",
    level: "JV",
    record: "14–6",
    players: 11,
    games: 20,
    isStarred: true,
    isDefault: false,
    isArchived: false,
    updatedLabel: "Updated yesterday",
  },
  {
    id: "3",
    name: "Brookfield East 8th Grade",
    season: "2025–26",
    level: "Middle School",
    record: "9–5",
    players: 10,
    games: 14,
    isStarred: false,
    isDefault: false,
    isArchived: false,
    updatedLabel: "Updated 3d ago",
  },
  {
    id: "4",
    name: "Summer Skills Camp",
    season: "2025",
    level: "Camp",
    record: "—",
    players: 24,
    games: 0,
    isStarred: false,
    isDefault: false,
    isArchived: true,
    updatedLabel: "Archived 1w ago",
  },
] as const;

const Teams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeamTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const allCount = MOCK_TEAMS.filter((team) => !team.isArchived).length;
  const starredCount = MOCK_TEAMS.filter(
    (team) => team.isStarred && !team.isArchived,
  ).length;
  const archivedCount = MOCK_TEAMS.filter((team) => team.isArchived).length;

  const visibleTeams = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return MOCK_TEAMS.filter((team) => {
      const matchesTab =
        activeTab === "all"
          ? !team.isArchived
          : activeTab === "starred"
            ? team.isStarred && !team.isArchived
            : team.isArchived;

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        team.name,
        team.season,
        team.level,
        team.record,
        team.updatedLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [activeTab, searchTerm]);

  const summaryChips = useMemo(() => {
    return [
      { key: "all", label: `${allCount} active` },
      { key: "starred", label: `${starredCount} starred` },
      { key: "archived", label: `${archivedCount} archived` },
    ];
  }, [allCount, starredCount, archivedCount]);

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    teamId: string,
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedTeamId(teamId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedTeamId(null);
  };

  const controls = (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.25}
        sx={{
          alignItems: { xs: "stretch", lg: "center" },
          minWidth: 0,
          flex: 1,
        }}
      >
        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search teams"
          size="small"
          fullWidth
          sx={{
            maxWidth: { xs: "100%", lg: 360 },
            "& .MuiInputBase-root": {
              minHeight: 40,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {summaryChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              size="small"
              variant="outlined"
              sx={{
                height: 28,
                fontWeight: 600,
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ minHeight: 36, alignSelf: { xs: "stretch", md: "center" } }}
      >
        Add team
      </Button>
    </Stack>
  );

  const renderEmptyState = () => (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        px: { xs: 2, md: 3 },
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        No teams found
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Try a different search or add a new team to get started.
      </Typography>
    </Box>
  );

  const renderTeamCard = (team: TeamRecord) => (
    <Box
      key={team.id}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        p: 2,
        minWidth: 0,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", mb: 0.75 }}
            >
              {team.isDefault ? (
                <Chip
                  icon={<DefaultIcon />}
                  label="Default"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              ) : null}
              {team.isStarred ? (
                <Chip
                  icon={<StarFilledIcon />}
                  label="Starred"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ) : null}
              {team.isArchived ? (
                <Chip
                  label="Archived"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ) : null}
            </Stack>

            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                wordBreak: "break-word",
              }}
            >
              {team.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {team.season} • {team.level}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={(event) => handleOpenMenu(event, team.id)}
            aria-label={`Open actions for ${team.name}`}
            sx={{ flexShrink: 0 }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", alignItems: "center" }}
        >
          <Chip
            label={`Record ${team.record}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`${team.players} players`}
            size="small"
            variant="outlined"
          />
          <Chip label={`${team.games} games`} size="small" variant="outlined" />
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            pt: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {team.updatedLabel}
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button size="small" variant="text">
              Open
            </Button>
            <Button size="small" variant="outlined">
              Dashboard
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );

  const renderGrid = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(3, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      {visibleTeams.map(renderTeamCard)}
    </Box>
  );

  return (
    <>
      <AppPageShell<TeamTab>
        title="Teams"
        activeTab={activeTab}
        tabs={TABS}
        onTabChange={(tab) => setActiveTab(tab)}
        controls={controls}
      >
        <PageSectionCard>
          <Box sx={{ p: { xs: 2.5, md: 0 } }}>
            <PageSectionIntro
              title={
                activeTab === "all"
                  ? "All teams"
                  : activeTab === "starred"
                    ? "Starred teams"
                    : "Archived teams"
              }
              description={
                activeTab === "all"
                  ? "Manage active teams and jump into the team workspace."
                  : activeTab === "starred"
                    ? "Quick access to the teams you care about most."
                    : "Review archived teams without cluttering your active list."
              }
            />

            {visibleTeams.length === 0 ? renderEmptyState() : renderGrid()}
          </Box>
        </PageSectionCard>
      </AppPageShell>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleCloseMenu}>Open team</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Open dashboard</MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          {selectedTeamId &&
          MOCK_TEAMS.find((team) => team.id === selectedTeamId)?.isStarred
            ? "Remove star"
            : "Add star"}
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>Set as default</MenuItem>
        <MenuItem onClick={handleCloseMenu}>Archive</MenuItem>
      </Menu>
    </>
  );
};

export default Teams;
