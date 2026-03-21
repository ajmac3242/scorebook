import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  Avatar,
  IconButton,
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
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { db, type TeamPlayer } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateTeamAggregates,
  getInitials,
} from "../utils/stats";
import { MoleskineCard, StatItem } from "../components/SharedUI";
import { syncService } from "../utils/syncService";
import { Refresh as RefreshIcon } from "@mui/icons-material";

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
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState("#154C56");
  const [isSyncing, setIsSyncing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "points", direction: "desc" });

  const team = useLiveQuery(
    () =>
      teamId !== undefined
        ? db.teams.get(teamId as any)
        : Promise.resolve(undefined),
    [teamId],
  );

  // Sync edit states when team loads
  React.useEffect(() => {
    if (team) {
      setEditName(team.name || "");
      setEditLogoUrl(team.logoUrl || "");
      setEditColor(team.primaryColor || "#154C56");
    }
  }, [team]);

  const season = useLiveQuery(
    () =>
      team?.seasonId
        ? db.seasons.get(team.seasonId)
        : Promise.resolve(undefined),
    [team?.seasonId],
  );
  const teamPlayers =
    useLiveQuery(
      () =>
        teamId !== undefined
          ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
          : Promise.resolve([]),
      [teamId],
    ) || [];
  const allPlayers = useLiveQuery(() => db.players.toArray()) || [];

  const teamPlayerDetails = useMemo(() => {
    const playerIds = teamPlayers.map((tp) => tp.playerId.toString());
    return allPlayers.filter((p) => playerIds.includes(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const games =
    useLiveQuery(
      () =>
        teamId !== undefined
          ? db.games.where("teamId").equals(teamId.toString()).toArray()
          : Promise.resolve([]),
      [teamId],
    ) || [];
  const gameIds = useMemo(
    () => games.map((g) => g.id).filter(Boolean),
    [games],
  );
  const allStats =
    useLiveQuery(
      () =>
        gameIds.length > 0
          ? db.stats
              .where("gameId")
              .anyOf(gameIds as any[])
              .toArray()
          : Promise.resolve([]),
      [gameIds],
    ) || [];

  const teamAggregates = useMemo(
    () => calculateTeamAggregates(games, allStats),
    [games, allStats],
  );
  const playerStats = useMemo(() => {
    const stats = calculatePlayerAggregates(
      teamPlayerDetails,
      allStats,
      teamPlayers,
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

  const handleAddPlayerToTeam = async (playerId: string) => {
    if (
      !teamId ||
      teamPlayers.some((tp) => tp.playerId.toString() === playerId.toString())
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

  const handleRemovePlayerFromTeam = async (playerId: string) => {
    if (!teamId) return;
    await db.teamPlayers
      .where("[teamId+playerId]")
      .equals([teamId.toString(), playerId.toString()])
      .delete();
  };

  const handleUpdateJersey = async (playerId: string, jersey: string) => {
    if (!teamId) return;
    const record = await db.teamPlayers
      .where("[teamId+playerId]")
      .equals([teamId.toString(), playerId.toString()])
      .first();
    if (record?.id)
      await db.teamPlayers.update(record.id, { jerseyNumber: jersey });
  };

  const handleUpdateTeamSettings = async () => {
    if (!teamId) return;
    await db.teams.update(teamId as any, {
      name: editName,
      logoUrl: editLogoUrl,
      primaryColor: editColor,
      synced: 0,
    });
    setOpenSettingsDialog(false);
  };

  const handleSync = async () => {
    if (!teamId) return;
    setIsSyncing(true);
    await syncService.syncAllForTeam(teamId.toString());
    setIsSyncing(false);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

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

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          p: 4,
          mb: 0,
          borderRadius: "8px 8px 0 0",
          bgcolor: team?.primaryColor || "var(--palette-deep-ocean)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          transition: "background-color 0.3s ease",
        }}
      >
        <IconButton
          onClick={() => navigate("/teams")}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "white",
            bgcolor: "rgba(255,255,255,0.1)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Grid container alignItems="center" spacing={4} sx={{ mt: 1 }}>
          <Grid item>
            {team?.logoUrl ? (
              <Box
                component="img"
                src={team.logoUrl}
                sx={{
                  width: { xs: 100, md: 150 },
                  height: "auto",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: { xs: 100, md: 150 },
                  height: { xs: 100, md: 150 },
                  bgcolor: "rgba(255,255,255,0.1)",
                  fontSize: "3rem",
                }}
              >
                {getInitials(team?.name || "T")}
              </Avatar>
            )}
          </Grid>
          <Grid item xs={12} md>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "white",
              }}
            >
              {team?.name}
            </Typography>
            <Typography
              variant="h5"
              sx={{ opacity: 0.9, fontWeight: 500, color: "white" }}
            >
              {teamAggregates.record} | {season?.name}
            </Typography>
          </Grid>
          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={4}>
              <StatItem label="PPG" value={teamAggregates.ppg} light />
              <StatItem label="RPG" value={teamAggregates.rpg} light />
              <StatItem label="APG" value={teamAggregates.apg} light />
              <StatItem label="OPPG" value={teamAggregates.oppg} light />
            </Stack>
          </Grid>
        </Grid>
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isSyncing ? <RefreshIcon className="spin" /> : <RefreshIcon />
            }
            onClick={handleSync}
            disabled={isSyncing}
            className="hover-grow"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setEditName(team?.name || "");
              setEditLogoUrl(team?.logoUrl || "");
              setEditColor(team?.primaryColor || "#154C56");
              setOpenSettingsDialog(true);
            }}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
          >
            Edit Team
          </Button>
        </Box>
      </Box>

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
                  scheduleView === "all" ||
                  (!g.completed && new Date(g.date) >= new Date()),
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
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
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
                      (t) => t.playerId.toString() === player.id?.toString(),
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
                (t) => t.playerId.toString() === player.id?.toString(),
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
                          sx={{ width: 50 }}
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
    </Box>
  );
};

export default TeamStats;
