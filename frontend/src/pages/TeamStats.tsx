import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
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
} from "@mui/material";
import { PersonAdd as PersonAddIcon, Restore, Warning } from "@mui/icons-material";
import { db, TeamPlayer, Team, Season, StatEvent } from "../db";
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

/**
 * TeamStats page component.
 * Provides detailed statistics for a team, including a schedule, box scores,
 * and roster management.
 */
const TeamStats: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const [statView, setStatView] = useState<"total" | "average">("total");
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [scheduleView, setScheduleView] = useState<"upcoming" | "all">(
    "upcoming",
  );
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState("#154C56");
  const [isSyncing, setIsSyncing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const team = useLiveQuery(
    async () =>
      teamId !== undefined
        ? await db.teams.get(teamId)
        : undefined,
    [teamId],
  );

  // Sync edit states when team loads
  useEffect(() => {
    if (team) {
      setEditName(team.name || "");
      setEditLogoUrl(team.logoUrl || "");
      setEditColor(team.primaryColor || "#154C56");
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

  const season = useLiveQuery(
    async () =>
      team?.seasonId
        ? await db.seasons.get(team.seasonId)
        : undefined,
    [team?.seasonId],
  );

  // Use shared hooks
  const games = useGames(teamId);
  const allPlayers = usePlayers();

  const teamPlayers =
    useLiveQuery(
      async () =>
        teamId !== undefined
          ? await db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
          : [],
      [teamId],
    ) || [];

  const teamPlayerDetails = useMemo(() => {
    const playerIds = teamPlayers.map((tp: TeamPlayer) => tp.playerId.toString());
    return allPlayers.filter((p) => playerIds.includes(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const gameIds = useMemo(
    () => games.map((g) => g.id).filter(Boolean),
    [games],
  );
  const allStats =
    useLiveQuery(
      async () =>
        gameIds.length > 0
          ? await db.stats
              .where("gameId")
              .anyOf(gameIds as string[])
              .toArray()
          : [],
      [gameIds],
    ) || [];

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats as StatEvent[]),
    [games, allStats],
  );

  const playerStats = useMemo(() => {
    const stats = calculatePlayerAggregates(
      teamPlayerDetails,
      allStats as StatEvent[],
      teamPlayers as TeamPlayer[],
      statView,
    );
    return [...stats].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [teamPlayerDetails, allStats, teamPlayers, statView, sortConfig]);

  /**
   * Adds a global player to the team's roster.
   */
  const handleAddPlayerToTeam = async (playerId: string) => {
    if (
      !teamId ||
      teamPlayers.some((tp: TeamPlayer) => tp.playerId.toString() === playerId.toString())
    )
      return;

    const player = allPlayers.find(
      (p) => p.id?.toString() === playerId.toString(),
    );

    const newTeamPlayer: TeamPlayer = {
      id: crypto.randomUUID(),
      teamId: teamId.toString(),
      playerId,
      name: player?.name,
      avatarColor: player?.avatarColor,
      jerseyNumber: "",
      synced: 0,
    };
    await db.teamPlayers.add(newTeamPlayer);
  };

  /**
   * Removes a player from the team roster.
   */
  const handleRemovePlayerFromTeam = async (playerId: string) => {
    if (!teamId) return;
    await db.teamPlayers
      .where("[teamId+playerId]")
      .equals([teamId.toString(), playerId.toString()])
      .delete();
  };

  /**
   * Updates a player's jersey number for this team.
   */
  const handleUpdateJersey = async (playerId: string, jersey: string) => {
    if (!teamId) return;
    const record = await db.teamPlayers
      .where("[teamId+playerId]")
      .equals([teamId.toString(), playerId.toString()])
      .first();
    if (record?.id)
      await db.teamPlayers.update(record.id, { jerseyNumber: jersey });
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
      const teamGames = await db.games.where("teamId").equals(team.id!).toArray();
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
      const teamGames = await db.games.where("teamId").equals(team.id!).toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt: undefined, synced: 0 });
      }
      syncService.pushUpdates();
    } catch (err) {
      console.error("Failed to restore team:", err);
    }
  };

  /**
   * Triggers a sync of all data for the current team.
   */
  const handleSync = async () => {
    if (!teamId) return;
    setIsSyncing(true);
    await syncService.syncAllForTeam(teamId.toString());
    setIsSyncing(false);
  };

  /**
   * Updates the column sorting configuration.
   */
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  /**
   * Helper component for sortable table headers.
   */
  const SortableHeader = ({
    label,
    sortKey,
    align = "right",
  }: {
    label: string;
    sortKey: string;
    align?: "left" | "center" | "right";
  }) => (
    <TableCell
      align={align}
      onClick={() => handleSort(sortKey)}
      sx={{
        cursor: "pointer",
        fontWeight: 700,
        "&:hover": { color: "primary.main" },
        whiteSpace: "nowrap",
      }}
    >
      {label}{" "}
      {sortConfig.key === sortKey &&
        (sortConfig.direction === "asc" ? "↑" : "↓")}
    </TableCell>
  );

  const isDeleted = !!team?.deletedAt || !!season?.deletedAt;
  const isPendingDelete = !!team?.deletedAt;

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={team?.name || "Team"}
        subtitle={`${teamAggregates.record} | ${season?.name || ""}`}
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
        onSync={handleSync}
        isSyncing={isSyncing}
        actions={
          <Stack direction="row" spacing={1}>
            {!isDeleted ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenSettingsDialog(true)}
                  sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
                >
                  Edit Team
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ borderColor: "rgba(255,0,0,0.5)", "&:hover": { borderColor: "error.main" } }}
                >
                  Delete Team
                </Button>
              </>
            ) : isPendingDelete && !season?.deletedAt ? (
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
          <AlertTitle>{season?.deletedAt ? "Season Pending Deletion" : "Team Pending Deletion"}</AlertTitle>
          {season?.deletedAt
            ? "The entire season is pending deletion. This team is in read-only mode."
            : `This team and its games are scheduled for permanent deletion in ${timeLeft}. All data is currently read-only.`
          }
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
            <ToggleButtonGroup
              value={scheduleView}
              exclusive
              onChange={(_, val) => val && setScheduleView(val)}
              size="small"
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
                  (!g.completed && new Date(g.date) >= new Date())) && !g.deletedAt,
              )
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
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
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(game.date).toLocaleDateString()} @{" "}
                      {game.location}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      vs {game.opponent}
                    </Typography>
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
              justifyContent: "space-between",
              alignItems: "center",
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
            >
              <ToggleButton value="total">Totals</ToggleButton>
              <ToggleButton value="average">Averages</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TableContainer component={MoleskineCard}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <SortableHeader
                    label="#"
                    sortKey="jerseyNumber"
                    align="left"
                  />
                  <SortableHeader label="PLAYER" sortKey="name" align="left" />
                  <SortableHeader label="GP" sortKey="gp" align="center" />
                  <SortableHeader
                    label={STAT_ACRONYMS.POINTS}
                    sortKey="points"
                  />
                  <SortableHeader label="FG%" sortKey="fgPct" />
                  <SortableHeader
                    label={STAT_ACRONYMS.REBOUNDS}
                    sortKey="rebounds"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.ASSISTS}
                    sortKey="assists"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.STEALS}
                    sortKey="steals"
                  />
                  <SortableHeader
                    label={STAT_ACRONYMS.TURNOVERS}
                    sortKey="turnovers"
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
                      navigate(
                        `/players/${row.id}?teamId=${teamId}&seasonId=${team?.seasonId}`,
                      )
                    }
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      {row.jerseyNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: row.avatarColor || "grey.500" }}>
                          {getInitials(row.name)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600 }}>
                          {row.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">{row.gp}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.points}
                    </TableCell>
                    <TableCell align="right">{row.fgPct}%</TableCell>
                    <TableCell align="right">{row.rebounds}</TableCell>
                    <TableCell align="right">{row.assists}</TableCell>
                    <TableCell align="right">{row.steals}</TableCell>
                    <TableCell align="right">{row.turnovers}</TableCell>
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
            {teamPlayerDetails.map((player) => (
              <Grid item xs={12} sm={6} md={4} key={player.id}>
                <MoleskineCard
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
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
                    {teamPlayers.find(
                      (t: TeamPlayer) => t.playerId.toString() === player.id?.toString(),
                    )?.jerseyNumber || "-"}
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
        <DialogTitle>Edit Team Details</DialogTitle>
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
                  height: 40,
                  marginTop: 8,
                }}
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateTeamSettings} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRosterDialog}
        onClose={() => setOpenRosterDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manage Team Roster</DialogTitle>
        <DialogContent>
          <List>
            {allPlayers.map((player) => {
              const tp = teamPlayers.find(
                (t: TeamPlayer) => t.playerId.toString() === player.id?.toString(),
              );
              return (
                <ListItem
                  key={player.id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {tp && (
                        <TextField
                          size="small"
                          label="#"
                          type="number"
                          slotProps={{ htmlInput: { min: 0, max: 99 } }}
                          sx={{ width: 60 }}
                          defaultValue={tp.jerseyNumber}
                          onBlur={(e) =>
                            handleUpdateJersey(
                              player.id!.toString(),
                              e.target.value,
                            )
                          }
                        />
                      )}
                      <Button
                        variant={tp ? "outlined" : "contained"}
                        color={tp ? "error" : "primary"}
                        onClick={() =>
                          tp
                            ? handleRemovePlayerFromTeam(player.id!.toString())
                            : handleAddPlayerToTeam(player.id!.toString())
                        }
                      >
                        {tp ? "Remove" : "Add"}
                      </Button>
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
        <DialogActions>
          <Button onClick={() => setOpenRosterDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>Delete Team?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{team?.name}</strong>?
            This will mark the team and ALL its associated games as pending deletion.
            You will have 24 hours to restore it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTeam} color="error" variant="contained">Yes, Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamStats;
