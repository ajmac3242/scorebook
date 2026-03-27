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
} from "@mui/icons-material";
import { db, type TeamPlayer, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateTeamAggregates,
  getInitials,
} from "../utils/stats";
import { MoleskineCard } from "../components/SharedUI";
import { syncService } from "../utils/syncService";
import EntityBanner from "../components/EntityBanner";
import { useGames } from "../hooks/useGames";
import { usePlayers } from "../hooks/usePlayers";
import dayjs from "dayjs";
import SortableHeader from "../components/SortableHeader";

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
  const [timeLeft, setTimeLeft] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const [openAddGame, setOpenAddGame] = useState(false);
  const [newOpponent, setNewOpponent] = useState("");
  const [newOpponentLogoUrl, setNewOpponentLogoUrl] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
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

  const team = useLiveQuery(
    async () => (teamId !== undefined ? await db.teams.get(teamId) : undefined),
    [teamId],
  );

  useEffect(() => {
    if (team) {
      setEditName(team.name || "");
      setEditLogoUrl(team.logoUrl || "");
      setEditColor(team.primaryColor || "#154C56");
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

  const teamPlayersResult = useLiveQuery(
    async () =>
      teamId !== undefined
        ? await db.teamPlayers
            .where("teamId")
            .equals(teamId.toString())
            .toArray()
        : [],
    [teamId],
  );
  const teamPlayers = useMemo(
    () => teamPlayersResult || [],
    [teamPlayersResult],
  );

  const allRecentLocations =
    useLiveQuery(async () => {
      try {
        await db.open();
        const items = await db.games.toArray();
        // Optimization: Use a single forEach pass with a Set to avoid multiple intermediate arrays.
        const locationSet = new Set<string>();
        for (const g of items) {
          if (g.location) locationSet.add(g.location);
        }
        return Array.from(locationSet).sort();
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        return [];
      }
    }) || [];

  const teamPlayerDetails = useMemo(() => {
    // Convert playerIds to a Set for O(1) lookup
    const playerIdSet = new Set(
      teamPlayers.map((tp: TeamPlayer) => tp.playerId.toString()),
    );
    return allPlayers.filter((p) => playerIdSet.has(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const gameIds = useMemo(
    () => games.map((g) => g.id).filter(Boolean),
    [games],
  );
  const allStatsResult = useLiveQuery(
    async () =>
      gameIds.length > 0
        ? await db.stats
            .where("gameId")
            .anyOf(gameIds as string[])
            .toArray()
        : [],
    [gameIds],
  );
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats as StatEvent[]),
    [games, allStats],
  );

  const playerStats = useMemo(() => {
    const stats = calculatePlayerAggregates(
      teamPlayerDetails,
      allStats as StatEvent[],
      teamPlayers,
      statView,
    );
    return [...stats].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as number | string;
      const bValue = b[sortConfig.key as keyof typeof b] as number | string;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [teamPlayerDetails, allStats, teamPlayers, statView, sortConfig]);

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
            jerseyNumber: localJerseyNumbers[pId] || "",
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
      const existingPlayerIds = teamPlayers.map((tp) => tp.playerId.toString());
      for (const [pId, jersey] of Object.entries(localJerseyNumbers)) {
        // Only if they are in roster and not staged for removal
        if (
          existingPlayerIds.includes(pId) &&
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

      syncService.pushUpdates();
      setOpenRosterDialog(false);
      setPendingRosterChanges({});
      setLocalJerseyNumbers({});
    } catch (err) {
      console.error("Failed to save roster changes:", err);
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
      synced: 0,
    });
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
      syncService.pushUpdates();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete team:", err);
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
      syncService.pushUpdates();
    } catch (error) {
      console.error("Failed to restore team:", error);
    }
  };

  const handleAddGame = async () => {
    if (!teamId || !newOpponent.trim()) return;
    setIsSubmittingGame(true);
    try {
      await db.open();
      await db.games.add({
        id: crypto.randomUUID(),
        teamId: teamId.toString(),
        opponent: newOpponent,
        opponentLogoUrl: newOpponentLogoUrl,
        date: newDate,
        time: newTime,
        location: newLocation,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpenAddGame(false);
      setNewOpponent("");
      setNewOpponentLogoUrl("");
      setNewDate("");
      setNewTime("");
      setNewLocation("");
    } catch (error) {
      console.error("Failed to add game:", error);
    } finally {
      setIsSubmittingGame(false);
    }
  };

  const isDeleted = !!team?.deletedAt;
  const isPendingDelete = !!team?.deletedAt;

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
          { label: "OPPG", value: teamAggregates.oppg },
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
          <Tab label="Roster" sx={{ fontWeight: 600 }} />
        </Tabs>
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
              onClick={() => setOpenAddGame(true)}
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
            {games
              .filter(
                (g) =>
                  (scheduleView === "all" ||
                    (!g.completed && new Date(g.date) >= new Date())) &&
                  !g.deletedAt,
              )
              .sort((a, b) => {
                const dateTimeA = a.date + (a.time || "00:00");
                const dateTimeB = b.date + (b.time || "00:00");
                return dateTimeA.localeCompare(dateTimeB);
              })
              .map((game) => (
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
                        {dayjs(game.date).format("MM-DD-YYYY")}{" "}
                        {game.time || ""} @ {game.location}
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
                    label={STAT_ACRONYMS.POINTS}
                    sortKey="points"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Points"
                  />
                  <SortableHeader
                    label="FG%"
                    sortKey="fgPct"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    tooltip="Field Goal Percentage"
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
                </TableRow>
              </TableHead>
              <TableBody>
                {playerStats.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: "pointer" }}
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
                      {row.jerseyNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
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
                      {row.fgPct}%
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 2 && (
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
            {(() => {
              // Optimization: Pre-calculate jersey numbers in a Map to avoid O(N) lookups in the sort.
              const jerseyMap = new Map(
                teamPlayers.map((tp) => [tp.playerId, tp.jerseyNumber || ""]),
              );

              return [...teamPlayerDetails]
                .sort((a, b) => {
                  const aJersey = jerseyMap.get(a.id!) || "";
                  const bJersey = jerseyMap.get(b.id!) || "";
                  // Basketball sorting: 00, 0, then numeric 1-99. Empty/dash at the end.
                  if (aJersey === bJersey) return 0;
                  if (!aJersey) return 1;
                  if (!bJersey) return -1;
                  // Treat '00' as a special value that comes first, or just use numeric value
                  const aNum = parseInt(aJersey, 10);
                  const bNum = parseInt(bJersey, 10);
                  if (aNum === bNum) {
                    return aJersey.length - bJersey.length; // '00' vs '0'
                  }
                  return aNum - bNum;
                })
                .map((player) => (
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
                        {jerseyMap.get(player.id!) || "-"}
                      </Typography>
                      <Avatar sx={{ bgcolor: player.avatarColor }}>
                        {getInitials(player.name)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 600 }}>
                        {player.name}
                      </Typography>
                    </MoleskineCard>
                  </Grid>
                ));
            })()}
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
            {allPlayers
              .filter((p) =>
                p.name.toLowerCase().includes(rosterSearchTerm.toLowerCase()),
              )
              .map((player) => {
                const pId = player.id!.toString();
                const dbRecord = teamPlayers.find(
                  (t: TeamPlayer) => t.playerId.toString() === pId,
                );
                const stagedChange = pendingRosterChanges[pId];

                // Is currently considered "in" the roster in the UI
                let isIn = !!dbRecord;
                if (stagedChange?.action === "add") isIn = true;
                if (stagedChange?.action === "remove") isIn = false;

                const jersey =
                  localJerseyNumbers[pId] !== undefined
                    ? localJerseyNumbers[pId]
                    : dbRecord?.jerseyNumber || "";

                const playerEntityId = player.id?.toString() || "";
                return (
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
                  </ListItem>
                );
              })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelRoster}>Cancel</Button>
          <Button onClick={handleSaveRoster} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddGame} onClose={() => setOpenAddGame(false)}>
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Add New Game
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Opponent"
            fullWidth
            variant="outlined"
            value={newOpponent}
            onChange={(e) => setNewOpponent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOpponent.trim()) {
                handleAddGame();
              }
            }}
            disabled={isSubmittingGame}
          />
          <TextField
            margin="dense"
            label="Opponent Logo URL"
            fullWidth
            variant="outlined"
            value={newOpponentLogoUrl}
            onChange={(e) => setNewOpponentLogoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOpponent.trim()) {
                handleAddGame();
              }
            }}
            disabled={isSubmittingGame}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOpponent.trim()) {
                handleAddGame();
              }
            }}
            disabled={isSubmittingGame}
          />
          <TextField
            margin="dense"
            label="Time"
            type="time"
            fullWidth
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newOpponent.trim()) {
                handleAddGame();
              }
            }}
            disabled={isSubmittingGame}
          />
          <Autocomplete
            freeSolo
            options={allRecentLocations}
            value={newLocation}
            onInputChange={(_, newValue) => setNewLocation(newValue)}
            disabled={isSubmittingGame}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Location"
                fullWidth
                variant="outlined"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newOpponent.trim()) {
                    handleAddGame();
                  }
                }}
              />
            )}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenAddGame(false)}
            disabled={isSubmittingGame}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddGame}
            variant="contained"
            disabled={!newOpponent.trim() || isSubmittingGame}
          >
            {isSubmittingGame ? "Adding..." : "Add Game"}
          </Button>
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
