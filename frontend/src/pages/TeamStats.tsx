import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  InfoOutlined as InfoOutlinedIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Groups as GroupsIcon,
  NavigateBefore,
  NavigateNext,
  PersonAdd as PersonAddIcon,
  Restore,
  Search as SearchIcon,
  Warning,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";

import { db, type StatEvent, type TeamPlayer } from "../db";
import { STAT_ACRONYMS } from "../constants/stats";
import { useGames } from "../hooks/useGames";
import { usePlayers } from "../hooks/usePlayers";
import { useTokens } from "../theme/useTokens";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import {
  calculateLineupStats,
  calculatePlayerAggregates,
  calculateTeamAggregates,
  getInitials,
} from "../utils/stats";

import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import PageSectionIntro from "../components/layout/PageSectionIntro";
import EntityBanner from "../components/EntityBanner";
import EntityRowCard from "../components/cards/EntityRowCard";
import { MoleskineCard } from "../components/SharedUI";
import SortableHeader from "../components/SortableHeader";

type TeamStatsTab = "schedule" | "stats" | "lineups" | "roster";

const TABS: readonly AppPageTab<TeamStatsTab>[] = [
  { value: "schedule", label: "Schedule" },
  { value: "stats", label: "Team Stats" },
  { value: "lineups", label: "Lineup Analytics" },
  { value: "roster", label: "Roster" },
] as const;

const DEFAULT_TEAM_ACCENT = "#154C56";

const buildEmptyState = (
  icon: React.ReactNode,
  title: string,
  description: string,
  action?: React.ReactNode,
) => (
  <Box
    sx={{
      minHeight: 280,
      borderRadius: "20px",
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
        {icon}
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
        {title}
      </Box>

      <Box
        component="p"
        sx={{
          m: 0,
          color: "text.secondary",
          lineHeight: 1.6,
          maxWidth: 480,
          mx: "auto",
          mb: action ? 2.5 : 0,
        }}
      >
        {description}
      </Box>

      {action}
    </Box>
  </Box>
);

const TeamStats: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const sectionPadding = { xs: 2.5, md: 0 };
  const controlRadius = tokens.semantic.component.radius.button;

  const [activeTab, setActiveTab] = useState<TeamStatsTab>("schedule");
  const [statView, setStatView] = useState<"total" | "average">("total");
  const [gameCountFilter, setGameCountFilter] = useState<string>("all");
  const [scheduleView, setScheduleView] = useState<"upcoming" | "all">(
    "upcoming",
  );

  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [pendingRosterChanges, setPendingRosterChanges] = useState<{
    [playerId: string]: { action: "add" | "remove"; jersey?: string };
  }>({});
  const [localJerseyNumbers, setLocalJerseyNumbers] = useState<{
    [playerId: string]: string;
  }>({});
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");

  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TEAM_ACCENT);
  const [editPeriodType, setEditPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [editPeriodLength, setEditPeriodLength] = useState<number>(10);
  const [editOvertimeLength, setEditOvertimeLength] = useState<number>(5);
  const [editTimeoutLimit, setEditTimeoutLimit] = useState<number>(3);
  const [editFoulLimit, setEditFoulLimit] = useState<number>(5);
  const [editMaxStintDuration, setEditMaxStintDuration] = useState<number>(8);
  const [editFoulWarningThresholds, setEditFoulWarningThresholds] = useState<
    Record<string, number>
  >({});
  const [editPlaybook, setEditPlaybook] = useState<string[]>([]);
  const [newPlayName, setNewPlayName] = useState("");

  const [timeLeft, setTimeLeft] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });
  const [lineupSortConfig, setLineupSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "seconds", direction: "desc" });

  const [openAddGame, setOpenAddGame] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [newOpponent, setNewOpponent] = useState("");
  const [newOpponentId, setNewOpponentId] = useState<string | undefined>(
    undefined,
  );
  const [newOpponentLogoUrl, setNewOpponentLogoUrl] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPeriodType, setNewPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [newPeriodLength, setNewPeriodLength] = useState<number>(10);
  const [newTimeoutLimit, setNewTimeoutLimit] = useState<number>(3);
  const [newFoulLimit, setNewFoulLimit] = useState<number>(5);
  const [newTacticalKpis, setNewTacticalKpis] = useState<string[]>([
    "paint_touches",
    "efg",
    "stop_pct",
  ]);
  const [isSubmittingGame, setIsSubmittingGame] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const handleLineupSort = (key: string) => {
    setLineupSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const team = useLiveQuery(() => {
    if (teamId === undefined) return undefined;
    return db.teams.get(teamId);
  }, [teamId]);

  useEffect(() => {
    if (team) {
      setEditName(team.name || "");
      setEditLogoUrl(team.logoUrl || "");
      setEditColor(team.primaryColor || DEFAULT_TEAM_ACCENT);
      setEditPeriodType(team.periodType || "QUARTERS");
      setEditPeriodLength(
        team.defaultPeriodLength || (team.periodType === "HALVES" ? 20 : 10),
      );
      setEditOvertimeLength(team.defaultOvertimeLength || 5);
      setEditTimeoutLimit(team.defaultTimeoutLimit || team.fouls || 3);
      setEditFoulLimit(team.defaultFoulLimit || 5);
      setEditMaxStintDuration(team.maxStintDuration || 8);
      setEditFoulWarningThresholds(team.foulWarningThresholds || {});
      setEditPlaybook(team.playbook || []);
    }
  }, [team]);

  useEffect(() => {
    if (team?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(team.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [team?.deletedAt]);

  const gamesResult = useGames(teamId);
  const allPlayersResult = usePlayers();

  const games = useMemo(
    () => (Array.isArray(gamesResult) ? gamesResult : []),
    [gamesResult],
  );
  const allPlayers = useMemo(
    () => (Array.isArray(allPlayersResult) ? allPlayersResult : []),
    [allPlayersResult],
  );

  const teamPlayersResult = useLiveQuery(() => {
    if (teamId === undefined) return [];
    return db.teamPlayers.where("teamId").equals(teamId.toString()).toArray();
  }, [teamId]);

  const teamPlayers = useMemo<TeamPlayer[]>(
    () => (Array.isArray(teamPlayersResult) ? teamPlayersResult : []),
    [teamPlayersResult],
  );

  const allRecentLocationsResult = useLiveQuery(() => {
    return db.games
      .toArray()
      .then((items) => {
        const locationSet = new Set<string>();
        for (const g of items) {
          if (g.location) locationSet.add(g.location);
        }
        return Array.from(locationSet).sort();
      })
      .catch((error) => {
        logger.error("Failed to fetch locations:", error);
        return [];
      });
  });

  const allRecentLocations = useMemo(
    () =>
      Array.isArray(allRecentLocationsResult) ? allRecentLocationsResult : [],
    [allRecentLocationsResult],
  );

  const allOpponentsResult = useLiveQuery(() => db.opponents.toArray());
  const allOpponents = useMemo(
    () => (Array.isArray(allOpponentsResult) ? allOpponentsResult : []),
    [allOpponentsResult],
  );

  const teamPlayerDetails = useMemo(() => {
    const playerIdSet = new Set(
      teamPlayers.map((tp) => tp.playerId?.toString()).filter(Boolean),
    );
    return allPlayers.filter((p) => playerIdSet.has(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const gameIds = useMemo(() => {
    const completedGames = games
      .filter((g) => g.completed && !g.deletedAt)
      .sort((a, b) => {
        const dateTimeA = a.date + (a.time || "00:00");
        const dateTimeB = b.date + (b.time || "00:00");
        return dateTimeB.localeCompare(dateTimeA);
      });

    let filtered = completedGames;
    if (gameCountFilter !== "all") {
      filtered = completedGames.slice(0, parseInt(gameCountFilter, 10));
    }

    return filtered.map((g) => g.id).filter(Boolean);
  }, [games, gameCountFilter]);

  const allStatsResult = useLiveQuery(() => {
    if (gameIds.length === 0) return [];
    return db.stats
      .where("gameId")
      .anyOf(gameIds as string[])
      .toArray();
  }, [gameIds]);

  const allStats = useMemo(
    () => (Array.isArray(allStatsResult) ? allStatsResult : []),
    [allStatsResult],
  );

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats as StatEvent[]),
    [games, allStats],
  );

  const aggregatedStats = useMemo(() => {
    return calculatePlayerAggregates(
      teamPlayerDetails,
      allStats as StatEvent[],
      teamPlayers,
      statView,
    );
  }, [teamPlayerDetails, allStats, teamPlayers, statView]);

  const lineupStats = useMemo(
    () => calculateLineupStats(allStats as StatEvent[], lineupSortConfig),
    [allStats, lineupSortConfig],
  );

  const playerStats = useMemo(() => {
    return [...aggregatedStats].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as number | string;
      const bValue = b[sortConfig.key as keyof typeof b] as number | string;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [aggregatedStats, sortConfig]);

  const stageRosterChange = (playerId: string, currentlyIn: boolean) => {
    const dbRecord = teamPlayers.find(
      (t: TeamPlayer) => t.playerId.toString() === playerId,
    );
    const isAlreadyInDb = !!dbRecord;

    setPendingRosterChanges((prev) => {
      const next = { ...prev };
      if (currentlyIn) {
        if (isAlreadyInDb) {
          next[playerId] = { action: "remove" };
        } else {
          delete next[playerId];
        }
      } else {
        if (isAlreadyInDb) {
          delete next[playerId];
        } else {
          next[playerId] = { action: "add" };
        }
      }
      return next;
    });
  };

  const stageJerseyUpdate = (playerId: string, jersey: string) => {
    setLocalJerseyNumbers((prev) => ({ ...prev, [playerId]: jersey }));
  };

  const handleSaveRoster = async () => {
    if (!teamId) return;

    try {
      for (const [pId, change] of Object.entries(pendingRosterChanges)) {
        if (change.action === "add") {
          const player = allPlayers.find((p) => p.id?.toString() === pId);
          await db.teamPlayers.add({
            id: crypto.randomUUID(),
            teamId: teamId.toString(),
            playerId: pId,
            name: player?.name,
            avatarColor: player?.avatarColor,
            jerseyNumber: localJerseyNumbers[pId] ?? "",
            synced: 0,
          });
        } else if (change.action === "remove") {
          await db.teamPlayers
            .where("[teamId+playerId]")
            .equals([teamId.toString(), pId])
            .delete();
        }
      }

      const existingPlayerIds = new Set(
        teamPlayers.map((tp) => tp.playerId.toString()),
      );

      for (const [pId, jersey] of Object.entries(localJerseyNumbers)) {
        if (
          existingPlayerIds.has(pId) &&
          pendingRosterChanges[pId]?.action !== "remove"
        ) {
          const record = await db.teamPlayers
            .where("[teamId+playerId]")
            .equals([teamId.toString(), pId])
            .first();

          if (record?.id) {
            await db.teamPlayers.update(record.id, {
              jerseyNumber: jersey,
              synced: 0,
            });
          }
        }
      }

      await syncService.pushUpdates();
      setOpenRosterDialog(false);
      setPendingRosterChanges({});
      setLocalJerseyNumbers({});
      setRosterSearchTerm("");
      setSnackbar({
        open: true,
        message: "Roster updated.",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to save roster changes:", err);
      setSnackbar({
        open: true,
        message: "Unable to save roster changes.",
        severity: "error",
      });
    }
  };

  const handleCancelRoster = () => {
    setOpenRosterDialog(false);
    setPendingRosterChanges({});
    setLocalJerseyNumbers({});
    setRosterSearchTerm("");
  };

  const handleUpdateTeamSettings = async () => {
    if (!teamId) return;

    try {
      await db.teams.update(teamId, {
        name: editName,
        logoUrl: editLogoUrl,
        primaryColor: editColor,
        periodType: editPeriodType,
        defaultPeriodLength: editPeriodLength,
        defaultOvertimeLength: editOvertimeLength,
        defaultTimeoutLimit: editTimeoutLimit,
        defaultFoulLimit: editFoulLimit,
        maxStintDuration: editMaxStintDuration,
        foulWarningThresholds: editFoulWarningThresholds,
        playbook: editPlaybook,
        fouls: editTimeoutLimit,
        synced: 0,
      });

      await syncService.pushUpdates();
      setOpenSettingsDialog(false);
      setSnackbar({
        open: true,
        message: "Team settings updated.",
        severity: "success",
      });
    } catch (error) {
      logger.error("Failed to update team settings:", error);
      setSnackbar({
        open: true,
        message: "Unable to update team settings.",
        severity: "error",
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId || !team) return;
    try {
      const deletedAt = new Date().toISOString();
      await db.teams.update(team.id!, { deletedAt, synced: 0 });

      const teamGames = await db.games
        .where("teamId")
        .equals(team.id!)
        .toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt, synced: 0 });
      }

      await syncService.pushUpdates();
      setIsDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: "Team scheduled for deletion.",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to delete team:", err);
      setSnackbar({
        open: true,
        message: "Unable to delete team.",
        severity: "error",
      });
    }
  };

  const handleRestoreTeam = async () => {
    if (!teamId || !team) return;
    try {
      await db.teams.update(team.id!, { deletedAt: undefined, synced: 0 });

      const teamGames = await db.games
        .where("teamId")
        .equals(team.id!)
        .toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt: undefined, synced: 0 });
      }

      await syncService.pushUpdates();
      setSnackbar({
        open: true,
        message: "Team restored.",
        severity: "success",
      });
    } catch (error) {
      logger.error("Failed to restore team:", error);
      setSnackbar({
        open: true,
        message: "Unable to restore team.",
        severity: "error",
      });
    }
  };

  const handleAddGame = async () => {
    if (!teamId || !newOpponent.trim()) return;
    setIsSubmittingGame(true);

    try {
      await db.open();

      let opponentId = newOpponentId;
      if (!opponentId) {
        const existing = await db.opponents
          .where("name")
          .equals(newOpponent)
          .first();
        if (existing) {
          opponentId = existing.id;
        } else {
          opponentId = crypto.randomUUID();
          await db.opponents.add({
            id: opponentId,
            name: newOpponent,
            logoUrl: newOpponentLogoUrl,
            roster: [],
            synced: 0,
          });
        }
      }

      await db.games.add({
        id: crypto.randomUUID(),
        teamId: teamId.toString(),
        opponent: newOpponent,
        opponentId,
        opponentLogoUrl: newOpponentLogoUrl,
        date: newDate,
        time: newTime,
        location: newLocation,
        periodLength: newPeriodLength,
        timeoutLimit: newTimeoutLimit,
        foulLimit: newFoulLimit,
        periodType: newPeriodType,
        tacticalKpis: newTacticalKpis,
        synced: 0,
      });

      await syncService.pushUpdates();
      setOpenAddGame(false);
      resetGameForm();
      setSnackbar({
        open: true,
        message: "Game created.",
        severity: "success",
      });
    } catch (error) {
      logger.error("Failed to add game:", error);
      setSnackbar({
        open: true,
        message: "Unable to create game.",
        severity: "error",
      });
    } finally {
      setIsSubmittingGame(false);
    }
  };

  const resetGameForm = () => {
    setNewOpponent("");
    setNewOpponentId(undefined);
    setNewOpponentLogoUrl("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setActiveStep(0);

    if (team) {
      setNewPeriodType(team.periodType || "QUARTERS");
      setNewPeriodLength(
        team.defaultPeriodLength || (team.periodType === "HALVES" ? 20 : 10),
      );
      setNewTimeoutLimit(team.defaultTimeoutLimit || team.fouls || 3);
      setNewFoulLimit(team.defaultFoulLimit || 5);
    }
  };

  const isDeleted = !!team?.deletedAt;

  const filteredSchedule = useMemo(() => {
    const now = new Date();
    const result = games.filter((g) => {
      const isUpcomingMatch =
        scheduleView === "all" || (!g.completed && new Date(g.date) >= now);
      return isUpcomingMatch && !g.deletedAt;
    });

    return result.sort((a, b) => {
      const dateTimeA = a.date + (a.time || "00:00");
      const dateTimeB = b.date + (b.time || "00:00");
      if (dateTimeA < dateTimeB) return -1;
      if (dateTimeA > dateTimeB) return 1;
      return 0;
    });
  }, [games, scheduleView]);

  const sortedRoster = useMemo(() => {
    const getSortKey = (jersey: string): number => {
      if (!jersey) return 1000;
      if (jersey === "00") return -1;
      const num = parseInt(jersey, 10);
      return isNaN(num) ? 999 : num;
    };

    const jerseyMap = new Map<string | number, string>();
    for (const tp of teamPlayers) {
      jerseyMap.set(tp.playerId, tp.jerseyNumber ?? "");
    }

    return [...teamPlayerDetails]
      .map((player) => ({
        player,
        sortKey: getSortKey(jerseyMap.get(player.id!) ?? ""),
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => item.player);
  }, [teamPlayerDetails, teamPlayers]);

  const sortedRosterJerseyMap = useMemo(() => {
    const jerseyMap = new Map<string, string>();
    for (const tp of teamPlayers) {
      jerseyMap.set(tp.playerId, tp.jerseyNumber ?? "");
    }
    return jerseyMap;
  }, [teamPlayers]);

  const headerControls =
    activeTab === "stats" || activeTab === "lineups" ? (
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "flex-end",
          width: "100%",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: 0.2,
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          Analytics window
        </Typography>
        <ToggleButtonGroup
          value={gameCountFilter}
          exclusive
          onChange={(_, val) => val && setGameCountFilter(val)}
          size="small"
          fullWidth={Boolean(isMobile)}
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              borderRadius: `${controlRadius}px !important`,
              px: 1.5,
            },
          }}
        >
          <ToggleButton value="5">Last 5</ToggleButton>
          <ToggleButton value="10">Last 10</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    ) : undefined;

  const renderScheduleTab = () => (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Schedule"
            description="Manage upcoming games and review the full schedule for this team."
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
          <ToggleButtonGroup
            value={scheduleView}
            exclusive
            onChange={(_, val) => val && setScheduleView(val)}
            size="small"
            fullWidth={Boolean(isMobile)}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                borderRadius: `${controlRadius}px !important`,
                px: 1.75,
              },
            }}
          >
            <ToggleButton value="upcoming">Upcoming</ToggleButton>
            <ToggleButton value="all">All games</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetGameForm();
              setOpenAddGame(true);
            }}
            disabled={isDeleted}
            sx={{
              borderRadius: controlRadius,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              minHeight: 36,
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            Create game
          </Button>
        </Stack>

        {filteredSchedule.length === 0 ? (
          buildEmptyState(
            <GroupsIcon sx={{ fontSize: 30 }} />,
            scheduleView === "upcoming"
              ? "No upcoming games"
              : "No games scheduled yet",
            scheduleView === "upcoming"
              ? "Switch to all games or create a new matchup for this team."
              : "Create your first game to start tracking performance and results.",
            !isDeleted ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetGameForm();
                  setOpenAddGame(true);
                }}
                sx={{
                  borderRadius: controlRadius,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                }}
              >
                Create first game
              </Button>
            ) : undefined,
          )
        ) : (
          <Stack spacing={1.5}>
            {filteredSchedule.map((game) => (
              <EntityRowCard
                key={game.id}
                accentColor={team?.primaryColor || DEFAULT_TEAM_ACCENT}
                leading={
                  game.opponentLogoUrl ? (
                    <Box
                      component="img"
                      src={game.opponentLogoUrl}
                      alt={`${game.opponent} logo`}
                      sx={{
                        width: 44,
                        height: 44,
                        objectFit: "contain",
                        borderRadius: "12px",
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        p: 0.5,
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: "action.hover",
                        color: "text.secondary",
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(game.opponent)}
                    </Avatar>
                  )
                }
                eyebrow={
                  <>
                    {dayjs(game.date).format("MMM D, YYYY")}
                    {game.time ? ` • ${game.time}` : ""}
                    {game.location ? ` • ${game.location}` : ""}
                  </>
                }
                title={`vs ${game.opponent}`}
                badges={
                  game.completed ? (
                    <Chip
                      label="Final"
                      size="small"
                      sx={{
                        bgcolor: "var(--cs-semantic-color-success-subtle)",
                        color: "var(--cs-semantic-color-success-text)",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "var(--cs-typography-fontSize-xs)",
                      }}
                    />
                  ) : (
                    <Chip
                      label="Scheduled"
                      size="small"
                      sx={{
                        bgcolor: alpha(
                          team?.primaryColor || DEFAULT_TEAM_ACCENT,
                          0.1,
                        ),
                        color: team?.primaryColor || DEFAULT_TEAM_ACCENT,
                        border: "none",
                        fontWeight: 600,
                        fontSize: "var(--cs-typography-fontSize-xs)",
                      }}
                    />
                  )
                }
                actions={
                  <>
                    {!game.completed ? (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isDeleted}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/game?gameId=${game.id}&teamId=${teamId}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                          }
                        }}
                        sx={{
                          textTransform: "none",
                          borderRadius: controlRadius,
                          fontWeight: 600,
                          boxShadow: "none",
                        }}
                      >
                        Track
                      </Button>
                    ) : null}

                    <Button
                      variant="text"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game/stats?gameId=${game.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: "text.secondary",
                      }}
                    >
                      Open
                    </Button>
                  </>
                }
                onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/game/stats?gameId=${game.id}`);
                  }
                }}
                ariaLabel={`Open game details for ${game.opponent}`}
              />
            ))}
          </Stack>
        )}
      </Box>
    </PageSectionCard>
  );

  const renderStatsTab = () => (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Player performance"
            description="Review player production across the selected analytics window."
          />
        </Box>

        {playerStats.length === 0 ? (
          buildEmptyState(
            <GroupsIcon sx={{ fontSize: 30 }} />,
            "No player stats yet",
            "Player performance will appear here once you track completed games for this team.",
          )
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1.5 }}>
              <ToggleButtonGroup
                value={statView}
                exclusive
                onChange={(_, val) => val && setStatView(val)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    borderRadius: `${controlRadius}px !important`,
                    px: 1.75,
                  },
                }}
              >
                <ToggleButton value="total">Totals</ToggleButton>
                <ToggleButton value="average">Averages</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TableContainer
              component={MoleskineCard}
              sx={{
                p: 0,
                overflowX: "auto",
                mx: { xs: -2.5, md: 0 },
                width: { xs: "calc(100% + 40px)", md: "100%" },
              }}
            >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                >
                  <SortableHeader
                    label="#"
                    sortKey="jerseyNumber"
                    align="left"
                    hideOnMobile
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="PLAYER"
                    sortKey="name"
                    align="left"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="GP"
                    sortKey="gp"
                    align="center"
                    hideOnMobile
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Games Played"
                  />
                  <SortableHeader
                    label="MIN"
                    sortKey="min"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Minutes Played"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.POINTS}
                    sortKey="points"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Points"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.THREE_POINTERS_MADE}
                    sortKey="threePM"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="3-Pointers Made"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.THREE_POINTERS_ATTEMPTED}
                    sortKey="threePA"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="3-Pointers Attempted"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.THREE_POINTER_PERCENTAGE}
                    sortKey="threePPct"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="3-Pointer Percentage"
                  />
                  <SortableHeader
                    label="FG%"
                    sortKey="fgPct"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Field Goal Percentage"
                  />
                  <SortableHeader
                    label="eFG%"
                    sortKey="efgPct"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Effective Field Goal Percentage"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.REBOUNDS}
                    sortKey="rebounds"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Rebounds"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.ASSISTS}
                    sortKey="assists"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Assists"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.STEALS}
                    sortKey="steals"
                    hideOnMobile
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Steals"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.TURNOVERS}
                    sortKey="turnovers"
                    hideOnMobile
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Turnovers"
                  />
                  <SortableHeader
                    label="+/-"
                    sortKey="plusMinus"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Plus/Minus"
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {playerStats.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:nth-of-type(odd)": {
                        bgcolor: "background.paper",
                      },
                      "&:nth-of-type(even)": {
                        bgcolor: "var(--cs-semantic-color-surface-subtle)",
                      },
                    }}
                    onClick={() =>
                      navigate(`/players/${row.id}?teamId=${teamId}`)
                    }
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      {row.jerseyNumber ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: row.avatarColor || "grey.500",
                            width: { xs: 28, sm: 40 },
                            height: { xs: 28, sm: 40 },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: {
                                xs: "var(--cs-typography-fontSize-xs)",
                                sm: "var(--cs-typography-fontSize-sm)",
                              },
                            }}
                          >
                            {getInitials(row.name)}
                          </Typography>
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: {
                              xs: "var(--cs-typography-fontSize-xs)",
                              sm: "var(--cs-typography-fontSize-sm)",
                            },
                          }}
                        >
                          {row.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      {row.gp}
                    </TableCell>
                    <TableCell align="right">{row.min}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color: "var(--cs-semantic-color-stats-offensive)",
                      }}
                    >
                      {row.points}
                    </TableCell>
                    <TableCell align="right">{row.threePM}</TableCell>
                    <TableCell align="right">{row.threePA}</TableCell>
                    <TableCell align="right">{row.threePPct}%</TableCell>
                    <TableCell align="right">{row.fgPct}%</TableCell>
                    <TableCell align="right">{row.efgPct}%</TableCell>
                    <TableCell align="right">{row.rebounds}</TableCell>
                    <TableCell align="right">{row.assists}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      {row.steals}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                    >
                      {row.turnovers}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {gameIds.length === 0 && (
            <Box
              sx={{
                mt: 2,
                px: 2,
                py: 1.5,
                borderRadius: `${tokens.semantic.component.sectionCard.radius}px`,
                bgcolor: "var(--cs-semantic-color-surface-subtle)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <InfoOutlinedIcon
                sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
              />
              <Typography variant="body2" color="text.secondary">
                Stats will populate once you track completed games for this
                team.
              </Typography>
            </Box>
          )}
          </>
        )}
      </Box>
    </PageSectionCard>
  );

  const renderLineupsTab = () => (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Lineup efficiency"
            description="Compare lineup combinations by scoring margin, minutes, and net production."
          />
        </Box>

        {lineupStats.length === 0 ? (
          buildEmptyState(
            <GroupsIcon sx={{ fontSize: 30 }} />,
            "No lineup data yet",
            "Track completed games to unlock lineup combinations and net rating insights.",
          )
        ) : (
          <TableContainer
            component={MoleskineCard}
            sx={{ p: 0, overflowX: "auto" }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>Lineup</TableCell>
                  <SortableHeader
                    label="MIN"
                    sortKey="seconds"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="PTS FOR"
                    sortKey="pointsFor"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="PTS AGN"
                    sortKey="pointsAgainst"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="NET/40"
                    sortKey="netRatingPer40"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="+/-"
                    sortKey="netRating"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {lineupStats.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {row.lineup.map((pId) => (
                          <Avatar
                            key={pId}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "var(--cs-typography-fontSize-xs)",
                              bgcolor: "action.hover",
                              color: "text.primary",
                              fontWeight: 700,
                            }}
                          >
                            {localJerseyNumbers[pId] ||
                              sortedRosterJerseyMap.get(pId) ||
                              "??"}
                          </Avatar>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      {(row.seconds / 60).toFixed(1)}
                    </TableCell>
                    <TableCell align="right">{row.pointsFor}</TableCell>
                    <TableCell align="right">{row.pointsAgainst}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.netRatingPer40}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color:
                          row.netRating > 0
                            ? "success.main"
                            : row.netRating < 0
                              ? "error.main"
                              : "text.primary",
                      }}
                    >
                      {row.netRating > 0 ? `+${row.netRating}` : row.netRating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </PageSectionCard>
  );

  const renderRosterTab = () => (
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
            onClick={() => setOpenRosterDialog(true)}
            sx={{
              borderRadius: controlRadius,
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
          buildEmptyState(
            <PersonAddIcon sx={{ fontSize: 30 }} />,
            "No players on this roster",
            "Add players to this team to start tracking minutes, production, and lineup data.",
            !isDeleted ? (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenRosterDialog(true)}
                sx={{
                  borderRadius: controlRadius,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                }}
              >
                Add players
              </Button>
            ) : undefined,
          )
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
              const playerAggregate = aggregatedStats.find(
                (s) => s.id === player.id,
              );
              const gp = playerAggregate?.gp ?? 0;
              const pts = playerAggregate?.points ?? 0;

              return (
                <EntityRowCard
                  key={player.id}
                  accentColor={team?.primaryColor || DEFAULT_TEAM_ACCENT}
                  leading={
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ flexShrink: 0 }}
                    >
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
                  subtitle={
                    gp > 0 ? `${gp} GP · ${pts} PTS` : "No games tracked yet"
                  }
                  onClick={() =>
                    navigate(`/players/${player.id}?teamId=${teamId}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/players/${player.id}?teamId=${teamId}`);
                    }
                  }}
                  ariaLabel={`Open ${player.name}'s player dashboard`}
                />
              );
            })}
          </Box>
        )}
      </Box>
    </PageSectionCard>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "schedule":
        return renderScheduleTab();
      case "stats":
        return renderStatsTab();
      case "lineups":
        return renderLineupsTab();
      case "roster":
        return renderRosterTab();
      default:
        return renderScheduleTab();
    }
  };

  return (
    <>
      <AppPageShell<TeamStatsTab>
        breadcrumb={[
          { label: "Teams", to: "/teams" },
          { label: team?.name || "Team" },
        ]}
        activeTab={activeTab}
        tabs={TABS}
        onTabChange={(tab) => setActiveTab(tab)}
        controls={headerControls}
        headerContent={
          <EntityBanner
            title={team?.name || "Team"}
            subtitle={`${teamAggregates.record}${team?.description ? ` | ${team.description}` : ""}`}
            avatarSrc={team?.logoUrl}
            avatarColor="var(--cs-semantic-color-action-active)"
            primaryColor={team?.primaryColor}
            stats={[
              { label: "PPG", value: teamAggregates.ppg },
              { label: "RPG", value: teamAggregates.rpg },
              { label: "APG", value: teamAggregates.apg },
              { label: "PPP", value: teamAggregates.ppp },
              { label: "Def. PPP", value: teamAggregates.oppPpp },
            ]}
            actions={
              !isDeleted ? (
                <Tooltip title="Edit team">
                  <IconButton
                    aria-label="edit team"
                    onClick={() => setOpenSettingsDialog(true)}
                    sx={{
                      color: "var(--cs-semantic-color-text-inverse)",
                      bgcolor: "var(--cs-semantic-color-action-active)",
                      "&:hover": {
                        bgcolor: "var(--cs-semantic-color-action-selected)",
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  startIcon={<Restore />}
                  onClick={handleRestoreTeam}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    boxShadow: "none",
                  }}
                >
                  Restore team
                </Button>
              )
            }
          />
        }
      >
        <Stack spacing={3} sx={{ opacity: isDeleted ? 0.72 : 1 }}>
          {isDeleted ? (
            <Alert severity="warning" icon={<Warning />}>
              <AlertTitle>Team pending deletion</AlertTitle>
              This team and its games are scheduled for permanent deletion in{" "}
              {timeLeft}. All data is currently read-only.
            </Alert>
          ) : null}

          {renderContent()}
        </Stack>
      </AppPageShell>

      <Dialog
        open={openSettingsDialog}
        onClose={() => setOpenSettingsDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
          }}
        >
          Edit team details
          <Tooltip title="Delete team">
            <IconButton
              aria-label="delete team"
              color="error"
              onClick={() => {
                setOpenSettingsDialog(false);
                setIsDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Team name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <TextField
              fullWidth
              label="Logo URL"
              value={editLogoUrl}
              onChange={(e) => setEditLogoUrl(e.target.value)}
            />

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                Primary color
              </Typography>
              <Box
                component="input"
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                sx={{
                  display: "block",
                  width: "100%",
                  height: 48,
                  mt: 1,
                  p: 0.5,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: `${Math.max(tokens.semantic.shape.radius.md, 10)}px`,
                  cursor: "pointer",
                  bgcolor: "background.paper",
                }}
              />
            </Box>

            <Divider>
              <Chip label="Game defaults" size="small" />
            </Divider>

            <FormControl fullWidth>
              <InputLabel>Period type</InputLabel>
              <Select
                value={editPeriodType}
                label="Period type"
                onChange={(e) =>
                  setEditPeriodType(e.target.value as "QUARTERS" | "HALVES")
                }
              >
                <MenuItem value="QUARTERS">Quarters</MenuItem>
                <MenuItem value="HALVES">Halves</MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Period length (mins)"
                type="number"
                value={editPeriodLength}
                onChange={(e) =>
                  setEditPeriodLength(parseInt(e.target.value, 10) || 0)
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                fullWidth
                label="OT length (mins)"
                type="number"
                value={editOvertimeLength}
                onChange={(e) =>
                  setEditOvertimeLength(parseInt(e.target.value, 10) || 0)
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Max stint duration (mins)"
              type="number"
              value={editMaxStintDuration}
              onChange={(e) =>
                setEditMaxStintDuration(parseInt(e.target.value, 10) || 0)
              }
              slotProps={{ htmlInput: { min: 1 } }}
              helperText="Alert scorekeeper when a player exceeds this time."
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Timeouts"
                type="number"
                value={editTimeoutLimit}
                onChange={(e) =>
                  setEditTimeoutLimit(parseInt(e.target.value, 10) || 0)
                }
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                fullWidth
                label="Foul limit"
                type="number"
                value={editFoulLimit}
                onChange={(e) =>
                  setEditFoulLimit(parseInt(e.target.value, 10) || 0)
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Stack>

            <Divider>
              <Chip label="Foul warnings by period" size="small" />
            </Divider>

            <Box>
              <Typography
                variant="caption"
                sx={{ mb: 1, display: "block", color: "text.secondary" }}
              >
                Alert when a player reaches this many fouls in a period.
              </Typography>
              <Grid container spacing={1}>
                {[1, 2, 3, 4].map((p) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={p}>
                    <TextField
                      size="small"
                      label={`P${p}`}
                      type="number"
                      value={editFoulWarningThresholds[`P${p}`] || ""}
                      onChange={(e) =>
                        setEditFoulWarningThresholds((prev) => ({
                          ...prev,
                          [`P${p}`]: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      slotProps={{ htmlInput: { min: 0, max: editFoulLimit } }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider>
              <Chip label="Playbook" size="small" />
            </Divider>

            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mb: 1 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="New play name"
                  value={newPlayName}
                  onChange={(e) => setNewPlayName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPlayName.trim()) {
                      e.preventDefault();
                      setEditPlaybook([...editPlaybook, newPlayName.trim()]);
                      setNewPlayName("");
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (newPlayName.trim()) {
                      setEditPlaybook([...editPlaybook, newPlayName.trim()]);
                      setNewPlayName("");
                    }
                  }}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    minWidth: { xs: "100%", sm: 88 },
                  }}
                >
                  Add
                </Button>
              </Stack>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {editPlaybook.map((play, idx) => (
                  <Chip
                    key={idx}
                    label={play}
                    onDelete={() => {
                      const next = [...editPlaybook];
                      next.splice(idx, 1);
                      setEditPlaybook(next);
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateTeamSettings} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRosterDialog}
        onClose={handleCancelRoster}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Manage team roster</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search players"
            value={rosterSearchTerm}
            onChange={(e) => setRosterSearchTerm(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <List sx={{ pt: 0 }}>
            {allPlayers
              .filter((player) =>
                player.name
                  .toLowerCase()
                  .includes(rosterSearchTerm.toLowerCase()),
              )
              .map((player) => {
                const pId = player.id!.toString();
                const dbRecord = teamPlayers.find(
                  (tp) => tp.playerId.toString() === pId,
                );
                const stagedChange = pendingRosterChanges[pId];

                let isIn = !!dbRecord;
                if (stagedChange?.action === "add") isIn = true;
                if (stagedChange?.action === "remove") isIn = false;

                const jersey =
                  localJerseyNumbers[pId] !== undefined
                    ? localJerseyNumbers[pId]
                    : (dbRecord?.jerseyNumber ?? "");

                return (
                  <ListItem
                    key={player.id}
                    divider
                    sx={{
                      px: { xs: 1, sm: 2 },
                      alignItems: "center",
                    }}
                    secondaryAction={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: { xs: 0.5, sm: 1 },
                        }}
                      >
                        {isIn ? (
                          <TextField
                            size="small"
                            label="#"
                            slotProps={{ htmlInput: { maxLength: 2 } }}
                            sx={{ width: { xs: 60, sm: 80 } }}
                            value={jersey}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || /^\\d{1,2}$/.test(val)) {
                                stageJerseyUpdate(pId, val);
                              }
                            }}
                          />
                        ) : null}

                        {isIn ? (
                          <IconButton
                            edge="end"
                            aria-label={`remove ${player.name}`}
                            onClick={() => stageRosterChange(pId, true)}
                            color="error"
                            size="small"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => stageRosterChange(pId, false)}
                            sx={{
                              minWidth: { xs: 52, sm: 70 },
                              textTransform: "none",
                              fontWeight: 600,
                              boxShadow: "none",
                            }}
                          >
                            Add
                          </Button>
                        )}
                      </Box>
                    }
                  >
                    <Avatar sx={{ bgcolor: player.avatarColor, mr: 2 }}>
                      {getInitials(player.name)}
                    </Avatar>
                    <ListItemText primary={player.name} />
                  </ListItem>
                );
              })}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelRoster}>Cancel</Button>
          <Button onClick={handleSaveRoster} variant="contained">
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddGame}
        onClose={() => setOpenAddGame(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule new game</DialogTitle>

        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ py: 3 }}>
            <Step>
              <StepLabel>Opponent</StepLabel>
            </Step>
            <Step>
              <StepLabel>Logistics</StepLabel>
            </Step>
            <Step>
              <StepLabel>Settings</StepLabel>
            </Step>
            <Step>
              <StepLabel>Identity</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review</StepLabel>
            </Step>
          </Stepper>

          <Box sx={{ mt: 1, minHeight: 280 }}>
            {activeStep === 0 && (
              <Stack spacing={2.5}>
                <Autocomplete
                  freeSolo
                  options={allOpponents}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  value={
                    newOpponentId
                      ? allOpponents.find((o) => o.id === newOpponentId)
                      : newOpponent
                  }
                  onChange={(_, newValue) => {
                    if (typeof newValue === "string") {
                      setNewOpponent(newValue);
                      setNewOpponentId(undefined);
                    } else if (newValue && newValue.name) {
                      setNewOpponent(newValue.name);
                      setNewOpponentId(newValue.id);
                      if (newValue.logoUrl)
                        setNewOpponentLogoUrl(newValue.logoUrl);
                    } else {
                      setNewOpponent("");
                      setNewOpponentId(undefined);
                    }
                  }}
                  onInputChange={(_, newInputValue) =>
                    setNewOpponent(newInputValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      label="Opponent name"
                      fullWidth
                      placeholder="e.g. Springfield Atoms"
                      required
                    />
                  )}
                />

                <TextField
                  label="Opponent logo URL"
                  fullWidth
                  value={newOpponentLogoUrl}
                  onChange={(e) => setNewOpponentLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={2.5}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />

                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />

                <Autocomplete
                  freeSolo
                  options={allRecentLocations}
                  value={newLocation}
                  onInputChange={(_, newValue) => setNewLocation(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Location" fullWidth />
                  )}
                />
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={2.5}>
                <FormControl fullWidth>
                  <InputLabel>Period type</InputLabel>
                  <Select
                    value={newPeriodType}
                    label="Period type"
                    onChange={(e) =>
                      setNewPeriodType(e.target.value as "QUARTERS" | "HALVES")
                    }
                  >
                    <MenuItem value="QUARTERS">Quarters</MenuItem>
                    <MenuItem value="HALVES">Halves</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Period length (minutes)"
                  type="number"
                  value={newPeriodLength}
                  onChange={(e) =>
                    setNewPeriodLength(parseInt(e.target.value, 10) || 0)
                  }
                  slotProps={{ htmlInput: { min: 1 } }}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Timeouts"
                    type="number"
                    value={newTimeoutLimit}
                    onChange={(e) =>
                      setNewTimeoutLimit(parseInt(e.target.value, 10) || 0)
                    }
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                  <TextField
                    fullWidth
                    label="Foul limit"
                    type="number"
                    value={newFoulLimit}
                    onChange={(e) =>
                      setNewFoulLimit(parseInt(e.target.value, 10) || 0)
                    }
                    slotProps={{ htmlInput: { min: 1 } }}
                  />
                </Stack>
              </Stack>
            )}

            {activeStep === 3 && (
              <Stack spacing={1.5}>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                  SELECT TACTICAL IDENTITY KPIS
                </Typography>

                {[
                  {
                    id: "paint_touches",
                    label: "Paint Touches (Rim Pressure)",
                  },
                  { id: "efg", label: "eFG% (Shooting Efficiency)" },
                  { id: "stop_pct", label: "Stop % (Defensive Consistency)" },
                  { id: "to_rate", label: "Turnover Rate (Ball Security)" },
                  { id: "oreb_pct", label: "Offensive Rebound %" },
                ].map((kpi) => (
                  <FormControlLabel
                    key={kpi.id}
                    control={
                      <Checkbox
                        checked={newTacticalKpis.includes(kpi.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTacticalKpis([...newTacticalKpis, kpi.id]);
                          } else {
                            setNewTacticalKpis(
                              newTacticalKpis.filter((id) => id !== kpi.id),
                            );
                          }
                        }}
                      />
                    }
                    label={kpi.label}
                  />
                ))}
              </Stack>
            )}

            {activeStep === 4 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Review game details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      OPPONENT
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {newOpponent}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      LOGISTICS
                    </Typography>
                    <Typography variant="body1">
                      {newDate ? dayjs(newDate).format("MMM D, YYYY") : "—"}{" "}
                      {newTime}
                    </Typography>
                    <Typography variant="caption">{newLocation}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      FORMAT
                    </Typography>
                    <Typography variant="body2">
                      {newPeriodType} ({newPeriodLength}m)
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      LIMITS
                    </Typography>
                    <Typography variant="body2">
                      Fouls: {newFoulLimit} | Timeouts: {newTimeoutLimit}
                    </Typography>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 3 }}>
                  Everything looks good. Click “Create game” to add it to the
                  schedule.
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenAddGame(false)}
            disabled={isSubmittingGame}
          >
            Cancel
          </Button>
          <Box sx={{ flex: "1 1 auto" }} />
          <Button
            disabled={activeStep === 0 || isSubmittingGame}
            onClick={() => setActiveStep((prev) => prev - 1)}
            startIcon={<NavigateBefore />}
          >
            Back
          </Button>

          {activeStep < 4 ? (
            <Button
              variant="contained"
              disabled={
                (activeStep === 0 && !newOpponent.trim()) ||
                (activeStep === 1 && !newDate) ||
                isSubmittingGame
              }
              onClick={() => setActiveStep((prev) => prev + 1)}
              endIcon={<NavigateNext />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleAddGame}
              disabled={isSubmittingGame}
              sx={{
                bgcolor: "success.main",
                "&:hover": { bgcolor: "success.dark" },
              }}
            >
              {isSubmittingGame ? "Creating..." : "Create game"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete team?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{team?.name}</strong>? This
            will mark the team and all associated games as pending deletion. You
            will have 24 hours to restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            Yes, delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TeamStats;
