import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTheme,
  useMediaQuery,
  Box,
  Typography,
  Grid,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Tabs,
  Tab,
  Chip,
  Alert,
  AlertTitle,
  DialogContentText,
  IconButton,
  Autocomplete,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Restore,
  Warning,
  Edit as EditIcon,
  Delete,
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  NavigateNext,
  NavigateBefore,
} from "@mui/icons-material";
import { Stepper, Step, StepLabel } from "@mui/material";
import { db, type TeamPlayer, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateTeamAggregates,
  calculateLineupStats,
  getInitials,
  type PlayerAggregates,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import EntityBanner from "../components/EntityBanner";
import { useGames } from "../hooks/useGames";
import { usePlayers } from "../hooks/usePlayers";
import dayjs from "dayjs";
import SortableHeader from "../components/SortableHeader";

/**
 * Individual player statistic row component.
 * Memoized to prevent unnecessary re-renders when other parts of the table change.
 */
const StatRow: React.FC<{
  row: PlayerAggregates;
  teamId: string | undefined;
  navigate: (_path: string) => void;
}> = React.memo(({ row, teamId, navigate }) => (
  <TableRow
    hover
    sx={{ cursor: "pointer" }}
    onClick={() => navigate(`/players/${row.id}?teamId=${teamId}`)}
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar
          sx={{
            bgcolor: row.avatarColor || "grey.500",
            width: { xs: 24, sm: 40 },
            height: { xs: 24, sm: 40 },
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.6rem", sm: "0.8rem" } }}
          >
            {getInitials(row.name)}
          </Typography>
        </Avatar>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.75rem", sm: "1rem" },
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
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.min}
    </TableCell>
    <TableCell
      align="right"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "0.75rem", sm: "0.875rem" },
      }}
    >
      {row.points}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePM}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePA}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.fgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.efgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.rebounds}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.assists}
    </TableCell>
    <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
      {row.steals}
    </TableCell>
    <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
      {row.turnovers}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
    </TableCell>
  </TableRow>
));

/**
 * TeamStats page component.
 * Provides detailed statistics for a team, including a schedule, box scores,
 * and roster management.
 */
const TeamStats: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [statView, setStatView] = useState<"total" | "average">("total");
  const [gameCountFilter, setGameCountFilter] = useState<string>("all");
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [pendingRosterChanges, setPendingRosterChanges] = useState<{
    [playerId: string]: { action: "add" | "remove"; jersey?: string };
  }>({});
  const [localJerseyNumbers, setLocalJerseyNumbers] = useState<{
    [playerId: string]: string;
  }>({});
  const [tabValue, setTabValue] = useState(0);
  const [scheduleView, setScheduleView] = useState<"upcoming" | "all">(
    "upcoming",
  );
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState("#154C56");
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
  const [isSubmittingGame, setIsSubmittingGame] = useState(false);
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");

  /**
   * Updates the column sorting configuration.
   * @param {string} key - Column key to sort by.
   */
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
      setEditColor(team.primaryColor || "#154C56");
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
    // We only want to sync from DB when the team object itself changes (e.g. initial load)
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

  // Use shared hooks
  const games = useGames(teamId);
  const allPlayers = usePlayers();

  const teamPlayersResult = useLiveQuery(() => {
    if (teamId === undefined) return [];
    return db.teamPlayers
      .where("teamId")
      .equals(teamId.toString())
      .toArray();
  }, [teamId]);
  const teamPlayers = useMemo(
    () => teamPlayersResult || [],
    [teamPlayersResult],
  );

  const allRecentLocations =
    useLiveQuery(() => {
      return db.games
        .toArray()
        .then((items) => {
          // Optimization: Use a single forEach pass with a Set to avoid multiple intermediate arrays.
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
    }) || [];

  const allOpponents = useLiveQuery(() => db.opponents.toArray()) || [];

  const teamPlayerDetails = useMemo(() => {
    // Optimization: Use a single for loop and a Set for O(1) lookups to avoid intermediate array allocations.
    const playerIdSet = new Set();
    for (let i = 0; i < teamPlayers.length; i++) {
      playerIdSet.add(teamPlayers[i].playerId.toString());
    }

    const details = [];
    for (let i = 0; i < allPlayers.length; i++) {
      const p = allPlayers[i];
      if (playerIdSet.has(p.id?.toString() || "")) {
        details.push(p);
      }
    }
    return details;
  }, [allPlayers, teamPlayers]);

  const gameIds = useMemo(() => {
    // ⚡ Bolt: Sort and filter games by date for recent analytics
    const completedGames = games
      .filter((g) => g.completed && !g.deletedAt)
      .sort((a, b) => {
        const dateTimeA = a.date + (a.time || "00:00");
        const dateTimeB = b.date + (b.time || "00:00");
        return dateTimeB.localeCompare(dateTimeA);
      });

    let filtered = completedGames;
    if (gameCountFilter !== "all") {
      filtered = completedGames.slice(0, parseInt(gameCountFilter));
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
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats as StatEvent[]),
    [games, allStats],
  );

  const aggregatedStats = useMemo(() => {
    // 🏀 CoachBoard: Team-wide aggregation defaults to average period lengths
    // since multiple games may be involved.
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

  /**
   * Stages a player to be added or removed from the team's roster locally.
   * @param {string} playerId - Player ID.
   * @param {boolean} currentlyIn - Whether the player is currently in roster.
   */
  const stageRosterChange = (playerId: string, currentlyIn: boolean) => {
    const dbRecord = teamPlayers.find(
      (t: TeamPlayer) => t.playerId.toString() === playerId,
    );
    const isAlreadyInDb = !!dbRecord;

    setPendingRosterChanges((prev) => {
      const next = { ...prev };
      if (currentlyIn) {
        // Currently "In" the UI roster, so we want to "Remove" it
        if (isAlreadyInDb) {
          // It's in the DB, so we stage it for removal
          next[playerId] = { action: "remove" };
        } else {
          // It's not in the DB, it was just staged for addition, so we just un-stage it
          delete next[playerId];
        }
      } else {
        // Currently "Out" of the UI roster, so we want to "Add" it
        if (isAlreadyInDb) {
          // It's in the DB but was staged for removal, so we un-stage the removal
          delete next[playerId];
        } else {
          // It's not in the DB, so we stage it for addition
          next[playerId] = { action: "add" };
        }
      }
      return next;
    });
  };

  /**
   * Updates the local staged jersey number.
   * @param {string} playerId - Player ID.
   * @param {string} jersey - Jersey number.
   */
  const stageJerseyUpdate = (playerId: string, jersey: string) => {
    setLocalJerseyNumbers((prev) => ({ ...prev, [playerId]: jersey }));
  };

  /**
   * Persists all staged roster and jersey changes to the database.
   */
  const handleSaveRoster = async () => {
    if (!teamId) return;

    try {
      // 1. Process Additions/Removals
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

      // 2. Process remaining jersey updates for players already in the roster
      // Optimization: Use a Set for O(1) existence checks.
      const existingPlayerIds = new Set();
      for (let i = 0; i < teamPlayers.length; i++) {
        existingPlayerIds.add(teamPlayers[i].playerId.toString());
      }

      for (const [pId, jersey] of Object.entries(localJerseyNumbers)) {
        // Only if they are in roster and not staged for removal
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
    } catch (err) {
      logger.error("Failed to save roster changes:", err);
    }
  };

  /**
   * Resets local roster state and closes dialog.
   */
  const handleCancelRoster = () => {
    setOpenRosterDialog(false);
    setPendingRosterChanges({});
    setLocalJerseyNumbers({});
    setRosterSearchTerm("");
  };

  /**
   * Updates team-level metadata.
   */
  const handleUpdateTeamSettings = async () => {
    if (!teamId) return;
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
      fouls: editTimeoutLimit, // Keep legacy fouls field in sync with timeouts
      synced: 0,
    });
    await syncService.pushUpdates();
    setOpenSettingsDialog(false);
  };

  const handleDeleteTeam = async () => {
    if (!teamId || !team) return;
    try {
      const deletedAt = new Date().toISOString();
      await db.teams.update(team.id!, { deletedAt, synced: 0 });
      // Also soft delete all games for this team
      const teamGames = await db.games
        .where("teamId")
        .equals(team.id!)
        .toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt, synced: 0 });
      }
      await syncService.pushUpdates();
      setDeleteDialogOpen(false);
    } catch (err) {
      logger.error("Failed to delete team:", err);
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
    } catch (error) {
      logger.error("Failed to restore team:", error);
    }
  };

  const handleAddGame = async () => {
    if (!teamId || !newOpponent.trim()) return;
    setIsSubmittingGame(true);
    try {
      await db.open();

      let opponentId = newOpponentId;
      // If no ID but name provided, check if it exists or create it
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
        opponentId: opponentId,
        opponentLogoUrl: newOpponentLogoUrl,
        date: newDate,
        time: newTime,
        location: newLocation,
        periodLength: newPeriodLength,
        timeoutLimit: newTimeoutLimit,
        foulLimit: newFoulLimit,
        periodType: newPeriodType,
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpenAddGame(false);
      resetGameForm();
    } catch (error) {
      logger.error("Failed to add game:", error);
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
  const isPendingDelete = !!team?.deletedAt;

  const filteredSchedule = useMemo(() => {
    // Optimization: Pre-calculate current date once for the filter loop.
    const now = new Date();
    const result = [];
    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      const isUpcomingMatch =
        scheduleView === "all" || (!g.completed && new Date(g.date) >= now);
      if (isUpcomingMatch && !g.deletedAt) {
        result.push(g);
      }
    }

    // Optimization: Standardize sorting within the useMemo to avoid re-sorting during render.
    return result.sort((a, b) => {
      // ⚡ Bolt: Use direct comparison instead of localeCompare for better performance.
      const dateTimeA = a.date + (a.time || "00:00");
      const dateTimeB = b.date + (b.time || "00:00");
      if (dateTimeA < dateTimeB) return -1;
      if (dateTimeA > dateTimeB) return 1;
      return 0;
    });
  }, [games, scheduleView]);

  const sortedRoster = useMemo(() => {
    // ⚡ Bolt: Pre-calculate numeric sort keys in a single pass to optimize sorting.
    // This avoids repeated parseInt and complex branching inside the hot sort comparison loop.
    const getSortKey = (jersey: string): number => {
      if (!jersey) return 1000; // Empty jerseys go to the end
      if (jersey === "00") return -1; // '00' comes first in basketball
      const num = parseInt(jersey, 10);
      return isNaN(num) ? 999 : num;
    };

    // Optimization: Use a Map for O(1) jersey lookup during sort key generation.
    const jerseyMap = new Map<string | number, string>();
    for (let i = 0; i < teamPlayers.length; i++) {
      const tp = teamPlayers[i];
      jerseyMap.set(tp.playerId, tp.jerseyNumber ?? "");
    }

    const rosterWithKeys = [];
    for (let i = 0; i < teamPlayerDetails.length; i++) {
      const p = teamPlayerDetails[i];
      const jersey = jerseyMap.get(p.id!) ?? "";
      rosterWithKeys.push({ player: p, sortKey: getSortKey(jersey) });
    }

    return rosterWithKeys
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((item) => item.player);
  }, [teamPlayerDetails, teamPlayers]);

  const sortedRosterJerseyMap = useMemo(() => {
    const jerseyMap = new Map<string, string>();
    for (let i = 0; i < teamPlayers.length; i++) {
      jerseyMap.set(teamPlayers[i].playerId, teamPlayers[i].jerseyNumber ?? "");
    }
    return jerseyMap;
  }, [teamPlayers]);

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={team?.name || "Team"}
        subtitle={`${teamAggregates.record} | ${team?.description || ""}`}
        avatarSrc={team?.logoUrl}
        avatarColor="rgba(255,255,255,0.1)"
        backTo="/teams"
        primaryColor={team?.primaryColor}
        stats={[
          { label: "PPG", value: teamAggregates.ppg },
          { label: "RPG", value: teamAggregates.rpg },
          { label: "APG", value: teamAggregates.apg },
          { label: "PPP", value: teamAggregates.ppp },
          { label: "Def. PPP", value: teamAggregates.oppPpp },
        ]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted ? (
              <>
                <Tooltip title="Edit Team">
                  <IconButton
                    aria-label="edit team"
                    onClick={() => setOpenSettingsDialog(true)}
                    sx={{
                      color: "white",
                      bgcolor: "rgba(255,255,255,0.1)",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.2)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : isPendingDelete ? (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<Restore />}
                onClick={handleRestoreTeam}
              >
                Restore Team
              </Button>
            ) : null}
          </Stack>
        }
      />

      <Box
        sx={{
          mb: 4,
          borderRadius: "0 0 8px 8px",
          bgcolor: "white",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          sx={{ px: 2 }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Schedule" sx={{ fontWeight: 600 }} />
          <Tab label="Team Stats" sx={{ fontWeight: 600 }} />
          <Tab label="Lineup Analytics" sx={{ fontWeight: 600 }} />
          <Tab label="Roster" sx={{ fontWeight: 600 }} />
        </Tabs>

        {(tabValue === 1 || tabValue === 2) && (
          <Box sx={{ p: 1, pr: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                ANALYTICS WINDOW:
              </Typography>
              <ToggleButtonGroup
                value={gameCountFilter}
                exclusive
                onChange={(_, val) => val && setGameCountFilter(val)}
                size="small"
              >
                <ToggleButton value="5" sx={{ px: 2 }}>
                  Last 5
                </ToggleButton>
                <ToggleButton value="10" sx={{ px: 2 }}>
                  Last 10
                </ToggleButton>
                <ToggleButton value="all" sx={{ px: 2 }}>
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>
        )}
      </Box>

      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mx: 2 }}>
          <AlertTitle>Team Pending Deletion</AlertTitle>
          This team and its games are scheduled for permanent deletion in{" "}
          {timeLeft}. All data is currently read-only.
        </Alert>
      )}

      {tabValue === 0 && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
              alignItems: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
              Schedule
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={isDeleted}
              onClick={() => {
                resetGameForm();
                setOpenAddGame(true);
              }}
              sx={{
                bgcolor: "var(--palette-golden-dune)",
                color: "var(--palette-midnight)",
              }}
            >
              Create Game
            </Button>
          </Box>
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={scheduleView}
              exclusive
              onChange={(_, val) => val && setScheduleView(val)}
              size="small"
              fullWidth={Boolean(isMobile)}
            >
              <ToggleButton value="upcoming">Upcoming</ToggleButton>
              <ToggleButton value="all">All Games</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Stack spacing={2}>
            {filteredSchedule.map((game) => (
              <MoleskineCard
                key={game.id}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                }}
                onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {game.opponentLogoUrl && (
                    <Box
                      component="img"
                      src={game.opponentLogoUrl}
                      sx={{
                        width: 40,
                        height: 40,
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                    />
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(game.date).format("MM-DD-YYYY")} {game.time || ""}{" "}
                      @ {game.location}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      vs {game.opponent}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  {game.completed ? (
                    <Chip label="Final" size="small" />
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={isDeleted}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game?gameId=${game.id}&teamId=${teamId}`);
                      }}
                    >
                      Track
                    </Button>
                  )}
                </Box>
              </MoleskineCard>
            ))}
          </Stack>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
              Player Performance
            </Typography>
            <ToggleButtonGroup
              value={statView}
              exclusive
              onChange={(_, val) => val && setStatView(val)}
              size="small"
              fullWidth={Boolean(isMobile)}
            >
              <ToggleButton value="total">Totals</ToggleButton>
              <ToggleButton value="average">Averages</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TableContainer
            component={MoleskineCard}
            sx={{
              mx: { xs: -2, sm: 0 },
              width: { xs: "calc(100% + 32px)", sm: "100%" },
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
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
                  <StatRow
                    key={row.id}
                    row={row}
                    teamId={teamId}
                    navigate={navigate}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" sx={{ fontFamily: "var(--serif)", mb: 3 }}>
            Lineup Efficiency
          </Typography>
          <TableContainer component={MoleskineCard}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
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
                            sx={{ width: 24, height: 24, fontSize: "0.65rem" }}
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
                              : "inherit",
                      }}
                    >
                      {row.netRating > 0 ? `+${row.netRating}` : row.netRating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
              Team Roster
            </Typography>
            <Button
              variant="contained"
              disabled={isDeleted}
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenRosterDialog(true)}
              sx={{
                bgcolor: "var(--palette-golden-dune)",
                color: "var(--palette-midnight)",
              }}
            >
              Manage Roster
            </Button>
          </Box>
          <Grid container spacing={2}>
            {sortedRoster.map((player) => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <MoleskineCard
                  onClick={() =>
                    navigate(`/players/${player.id}?teamId=${teamId}`)
                  }
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "transform 0.2s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      bgcolor: "rgba(0,0,0,0.02)",
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "text.secondary",
                      minWidth: 40,
                    }}
                  >
                    {sortedRosterJerseyMap.get(player.id!) || "-"}
                  </Typography>
                  <Avatar sx={{ bgcolor: player.avatarColor }}>
                    {getInitials(player.name)}
                  </Avatar>
                  <Typography sx={{ fontWeight: 600 }}>
                    {player.name}
                  </Typography>
                </MoleskineCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Dialog
        open={openSettingsDialog}
        onClose={() => setOpenSettingsDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle
          sx={{
            fontFamily: "var(--serif)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Edit Team Details
          <Tooltip title="Delete Team">
            <IconButton
              aria-label="delete team"
              color="error"
              onClick={() => {
                setOpenSettingsDialog(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Team Name"
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
              <Typography variant="caption">Primary Color</Typography>
              <input
                type="color"
                style={{
                  display: "block",
                  width: "100%",
                  height: 48,
                  marginTop: 8,
                  padding: "2px",
                  border: "1px solid #D1D1D1",
                  borderRadius: 8,
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
              />
            </Box>

            <Divider sx={{ my: 1 }}>
              <Chip label="Game Defaults" size="small" />
            </Divider>

            <FormControl fullWidth>
              <InputLabel>Period Type</InputLabel>
              <Select
                value={editPeriodType}
                label="Period Type"
                onChange={(e) =>
                  setEditPeriodType(e.target.value as "QUARTERS" | "HALVES")
                }
              >
                <MenuItem value="QUARTERS">Quarters</MenuItem>
                <MenuItem value="HALVES">Halves</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Period Length (Mins)"
                type="number"
                value={editPeriodLength}
                onChange={(e) =>
                  setEditPeriodLength(parseInt(e.target.value) || 0)
                }
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                label="OT Length (Mins)"
                type="number"
                value={editOvertimeLength}
                onChange={(e) =>
                  setEditOvertimeLength(parseInt(e.target.value) || 0)
                }
                inputProps={{ min: 1 }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Max Stint Duration (Mins)"
              type="number"
              value={editMaxStintDuration}
              onChange={(e) =>
                setEditMaxStintDuration(parseInt(e.target.value) || 0)
              }
              inputProps={{ min: 1 }}
              helperText="Alert scorekeeper when player exceeds this time"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Timeouts"
                type="number"
                value={editTimeoutLimit}
                onChange={(e) =>
                  setEditTimeoutLimit(parseInt(e.target.value) || 0)
                }
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Foul Limit"
                type="number"
                value={editFoulLimit}
                onChange={(e) =>
                  setEditFoulLimit(parseInt(e.target.value) || 0)
                }
                inputProps={{ min: 1 }}
              />
            </Stack>

            <Divider sx={{ my: 1 }}>
              <Chip label="Foul Warnings by Period" size="small" />
            </Divider>
            <Box>
              <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
                Alert when player reaches this many fouls in a period
              </Typography>
              <Grid container spacing={1}>
                {[1, 2, 3, 4].map((p) => (
                  <Grid item xs={3} key={p}>
                    <TextField
                      size="small"
                      label={`P${p}`}
                      type="number"
                      value={editFoulWarningThresholds[`P${p}`] || ""}
                      onChange={(e) =>
                        setEditFoulWarningThresholds((prev) => ({
                          ...prev,
                          [`P${p}`]: parseInt(e.target.value) || 0,
                        }))
                      }
                      inputProps={{ min: 0, max: editFoulLimit }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider sx={{ my: 1 }}>
              <Chip label="Playbook" size="small" />
            </Divider>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="New Play Name"
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
                >
                  Add
                </Button>
              </Stack>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
          <Button
            onClick={handleUpdateTeamSettings}
            variant="contained"
            sx={{ ml: 1 }}
          >
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
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Manage Team Roster
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search players..."
            value={rosterSearchTerm}
            onChange={(e) => setRosterSearchTerm(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ color: "text.secondary", mr: 1 }}
                />
              ),
            }}
          />
          <List>
            {(() => {
              // Optimization: Normalize search term once outside the loop.
              const search = rosterSearchTerm.toLowerCase();
              // Optimization: Pre-calculate team player map for O(1) lookups during iteration.
              const teamPlayerMap = new Map<string, TeamPlayer>();
              for (let i = 0; i < teamPlayers.length; i++) {
                const tp = teamPlayers[i];
                teamPlayerMap.set(tp.playerId.toString(), tp);
              }

              const result = [];
              for (let i = 0; i < allPlayers.length; i++) {
                const player = allPlayers[i];
                if (player.name.toLowerCase().includes(search)) {
                  const pId = player.id!.toString();
                  const dbRecord = teamPlayerMap.get(pId);
                  const stagedChange = pendingRosterChanges[pId];

                  // Is currently considered "in" the roster in the UI
                  let isIn = !!dbRecord;
                  if (stagedChange?.action === "add") isIn = true;
                  if (stagedChange?.action === "remove") isIn = false;

                  const jersey =
                    localJerseyNumbers[pId] !== undefined
                      ? localJerseyNumbers[pId]
                      : (dbRecord?.jerseyNumber ?? "");

                  const playerEntityId = player.id?.toString() || "";
                  result.push(
                    <ListItem
                      key={playerEntityId}
                      divider
                      sx={{
                        px: { xs: 1, sm: 2 },
                      }}
                      secondaryAction={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 0.5, sm: 1 },
                          }}
                        >
                          {isIn && (
                            <TextField
                              size="small"
                              label="#"
                              inputProps={{ maxLength: 2 }}
                              sx={{ width: { xs: 60, sm: 80 } }}
                              value={jersey}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d{1,2}$/.test(val)) {
                                  stageJerseyUpdate(pId, val);
                                }
                              }}
                            />
                          )}
                          {isIn ? (
                            <IconButton
                              edge="end"
                              aria-label="remove"
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
                              sx={{ minWidth: { xs: 45, sm: 64 } }}
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
                    </ListItem>,
                  );
                }
              }
              return result;
            })()}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelRoster}>Cancel</Button>
          <Button onClick={handleSaveRoster} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddGame}
        onClose={() => setOpenAddGame(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Schedule New Game
        </DialogTitle>
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
              <StepLabel>Review</StepLabel>
            </Step>
          </Stepper>

          <Box sx={{ mt: 1, minHeight: 280 }}>
            {activeStep === 0 && (
              <Stack spacing={3}>
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
                      if (newValue.logoUrl) {
                        setNewOpponentLogoUrl(newValue.logoUrl);
                      }
                    } else {
                      setNewOpponent("");
                      setNewOpponentId(undefined);
                    }
                  }}
                  onInputChange={(_, newInputValue) => {
                    setNewOpponent(newInputValue);
                    // If they are typing something that matches an existing opponent exactly,
                    // we could link it, but usually better to let them select from dropdown.
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      label="Opponent Name"
                      fullWidth
                      placeholder="e.g. Springfield Atoms"
                      required
                    />
                  )}
                />
                <TextField
                  label="Opponent Logo URL"
                  fullWidth
                  value={newOpponentLogoUrl}
                  onChange={(e) => setNewOpponentLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack spacing={3}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
                <TextField
                  label="Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
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
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Period Type</InputLabel>
                  <Select
                    value={newPeriodType}
                    label="Period Type"
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
                  label="Period Length (Minutes)"
                  type="number"
                  value={newPeriodLength}
                  onChange={(e) =>
                    setNewPeriodLength(parseInt(e.target.value) || 0)
                  }
                  inputProps={{ min: 1 }}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Timeouts"
                    type="number"
                    value={newTimeoutLimit}
                    onChange={(e) =>
                      setNewTimeoutLimit(parseInt(e.target.value) || 0)
                    }
                    inputProps={{ min: 0 }}
                  />
                  <TextField
                    fullWidth
                    label="Foul Limit"
                    type="number"
                    value={newFoulLimit}
                    onChange={(e) =>
                      setNewFoulLimit(parseInt(e.target.value) || 0)
                    }
                    inputProps={{ min: 1 }}
                  />
                </Stack>
              </Stack>
            )}

            {activeStep === 3 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Review Game Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      OPPONENT
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {newOpponent}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      LOGISTICS
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(newDate).format("MMM D, YYYY")} {newTime}
                    </Typography>
                    <Typography variant="caption">{newLocation}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      FORMAT
                    </Typography>
                    <Typography variant="body2">
                      {newPeriodType} ({newPeriodLength}m)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      LIMITS
                    </Typography>
                    <Typography variant="body2">
                      Fouls: {newFoulLimit} | Timeouts: {newTimeoutLimit}
                    </Typography>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 3 }}>
                  Everything looks good! Click "Create Game" to add it to your
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
          {activeStep < 3 ? (
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
              {isSubmittingGame ? "Creating..." : "Create Game"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Delete Team?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{team?.name}</strong>? This
            will mark the team and ALL its associated games as pending deletion.
            You will have 24 hours to restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamStats;
