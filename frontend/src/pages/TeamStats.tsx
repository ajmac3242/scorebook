import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
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
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Divider,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  BarChart,
} from "@mui/icons-material";
import { db, type Player, type TeamPlayer, type Team } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS, ACTION_TYPES } from "../constants/stats";

const TeamStats: React.FC = () => {
  const { teamId: teamIdParam } = useParams<{ teamId: string }>();
  const teamId = teamIdParam
    ? isNaN(Number(teamIdParam))
      ? teamIdParam
      : Number(teamIdParam)
    : undefined;
  const navigate = useNavigate();

  const [statView, setStatView] = useState<"total" | "average">("total");
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [scheduleView, setScheduleView] = useState<"upcoming" | "all">(
    "upcoming",
  );
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState("");

  const team = useLiveQuery(
    () =>
      teamId !== undefined
        ? db.teams.get(teamId as any)
        : Promise.resolve(undefined),
    [teamId],
  );

  const season = useLiveQuery(
    () =>
      team?.seasonId
        ? db.seasons.get(Number(team.seasonId))
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

  const completedGames = useMemo(
    () => games.filter((g) => g.completed === 1),
    [games],
  );

  const teamAggregates = useMemo(() => {
    const cgIds = completedGames.map((g) => g.id);
    const stats = allStats.filter((s) => cgIds.includes(s.gameId as any));

    let totalPoints = 0;
    let totalRebounds = 0;
    let totalAssists = 0;
    let totalOppPoints = 0;
    let wins = 0;
    let losses = 0;

    cgIds.forEach((gId) => {
      let gameTeamPoints = 0;
      let gameOppPoints = 0;
      const gameStats = stats.filter((s) => s.gameId === gId);

      gameStats.forEach((s) => {
        if (s.playerId === "OPPONENT") {
          gameOppPoints += s.points || 0;
        } else {
          gameTeamPoints += s.points || 0;
          if (s.type === ACTION_TYPES.REBOUND) totalRebounds++;
          if (s.type === ACTION_TYPES.ASSIST) totalAssists++;
        }
      });

      totalPoints += gameTeamPoints;
      totalOppPoints += gameOppPoints;
      if (gameTeamPoints > gameOppPoints) wins++;
      else if (gameTeamPoints < gameOppPoints) losses++;
    });

    const gp = completedGames.length || 1;
    return {
      ppg: (totalPoints / gp).toFixed(1),
      rpg: (totalRebounds / gp).toFixed(1),
      apg: (totalAssists / gp).toFixed(1),
      oppg: (totalOppPoints / gp).toFixed(1),
      record: `${wins}-${losses}`,
    };
  }, [allStats, completedGames]);

  const playerStats = useMemo(() => {
    const statsMap: Record<string, any> = {};

    teamPlayerDetails.forEach((p) => {
      statsMap[p.id!.toString()] = {
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        jerseyNumber:
          teamPlayers.find((tp) => tp.playerId.toString() === p.id!.toString())
            ?.jerseyNumber || "",
        gamesPlayed: new Set(),
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        turnovers: 0,
        makes: 0,
        attempts: 0,
      };
    });

    allStats.forEach((s) => {
      const pId = s.playerId.toString();
      if (statsMap[pId]) {
        const p = statsMap[pId];
        p.gamesPlayed.add(s.gameId);

        if (s.type === ACTION_TYPES.MAKE) {
          p.points += s.points || 0;
          p.makes += 1;
          p.attempts += 1;
        } else if (s.type === ACTION_TYPES.MISS) {
          p.attempts += 1;
        } else if (s.type === ACTION_TYPES.REBOUND) {
          p.rebounds += 1;
        } else if (s.type === ACTION_TYPES.ASSIST) {
          p.assists += 1;
        } else if (s.type === ACTION_TYPES.STEAL) {
          p.steals += 1;
        } else if (s.type === ACTION_TYPES.TURNOVER) {
          p.turnovers += 1;
        }
      }
    });

    return Object.values(statsMap).map((p) => {
      const gp = p.gamesPlayed.size || 1;
      const data =
        statView === "total"
          ? p
          : {
              ...p,
              points: (p.points / gp).toFixed(1),
              rebounds: (p.rebounds / gp).toFixed(1),
              assists: (p.assists / gp).toFixed(1),
              steals: (p.steals / gp).toFixed(1),
              turnovers: (p.turnovers / gp).toFixed(1),
            };
      return {
        ...data,
        gp: p.gamesPlayed.size,
        fgPct:
          p.attempts > 0 ? ((p.makes / p.attempts) * 100).toFixed(1) : "0.0",
      };
    });
  }, [teamPlayerDetails, allStats, teamPlayers, statView]);

  const handleAddPlayerToTeam = async (playerId: string) => {
    if (!teamId) return;
    const exists = teamPlayers.find(
      (tp) => tp.playerId.toString() === playerId.toString(),
    );
    if (exists) return;

    const newTeamPlayer: TeamPlayer = {
      teamId: teamId.toString(),
      playerId: playerId,
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
    if (record?.id) {
      await db.teamPlayers.update(record.id, { jerseyNumber: jersey });
    }
  };

  const handleUpdateTeamSettings = async () => {
    if (!teamId) return;
    await db.teams.update(teamId as any, {
      logoUrl: editLogoUrl,
      primaryColor: editColor,
    });
    setOpenSettingsDialog(false);
  };

  const handleDetectColor = () => {
    if (!editLogoUrl) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let r = 0,
          g = 0,
          b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const count = data.length / 4;
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        setEditColor(hex);
      } catch (e) {
        console.error("CORS issue or canvas error", e);
      }
    };
    img.src = editLogoUrl;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Paper
        className="moleskine-card"
        sx={{
          p: 4,
          mb: 0,
          borderRadius: "8px 8px 0 0",
          bgcolor: team?.primaryColor || "var(--deep-ocean)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Grid container alignItems="center" spacing={4}>
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
            <Stack direction="row" spacing={4} sx={{ textAlign: "center" }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, color: "white" }}
                >
                  PPG
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  {teamAggregates.ppg}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, color: "white" }}
                >
                  RPG
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  {teamAggregates.rpg}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, color: "white" }}
                >
                  APG
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  {teamAggregates.apg}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, color: "white" }}
                >
                  OPPG
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "white" }}
                >
                  {teamAggregates.oppg}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setEditLogoUrl(team?.logoUrl || "");
              setEditColor(team?.primaryColor || "#154C56");
              setOpenSettingsDialog(true);
            }}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
          >
            Edit Team
          </Button>
        </Box>
      </Paper>

      <Paper
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
      </Paper>

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
              .filter((g) => {
                if (scheduleView === "upcoming") {
                  return !g.completed && new Date(g.date) >= new Date();
                }
                return true;
              })
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map((game) => (
                <Paper
                  key={game.id}
                  className="moleskine-card"
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onClick={() =>
                    navigate(
                      `/games?gameId=${game.id}&teamId=${teamId}&seasonId=${team?.seasonId}`,
                    )
                  }
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
                      <Chip label="Final" size="small" color="default" />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/game-mode?gameId=${game.id}&teamId=${teamId}`,
                          );
                        }}
                      >
                        Start Tracker
                      </Button>
                    )}
                  </Box>
                </Paper>
              ))}
            {games.length === 0 && (
              <Typography sx={{ textAlign: "center", py: 4 }}>
                No games scheduled yet.
              </Typography>
            )}
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

          <TableContainer component={Paper} className="moleskine-card">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell>#</TableCell>
                  <TableCell>PLAYER</TableCell>
                  <TableCell align="center">GP</TableCell>
                  <TableCell align="right">{STAT_ACRONYMS.POINTS}</TableCell>
                  <TableCell align="right">FG%</TableCell>
                  <TableCell align="right">{STAT_ACRONYMS.REBOUNDS}</TableCell>
                  <TableCell align="right">{STAT_ACRONYMS.ASSISTS}</TableCell>
                  <TableCell align="right">{STAT_ACRONYMS.STEALS}</TableCell>
                  <TableCell align="right">{STAT_ACRONYMS.TURNOVERS}</TableCell>
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
                    <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                      {row.jerseyNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: row.avatarColor || "grey.500",
                            fontFamily: "var(--serif)",
                          }}
                        >
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
                {playerStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No players in this team roster.
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        sx={{ mt: 1 }}
                        onClick={() => setOpenRosterDialog(true)}
                      >
                        Add Players
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
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
                bgcolor: "var(--golden-dune)",
                color: "var(--midnight)",
                "&:hover": { bgcolor: "#c5a272" },
              }}
            >
              Manage Roster
            </Button>
          </Box>
          <Grid container spacing={2}>
            {teamPlayerDetails.map((player) => {
              const tp = teamPlayers.find(
                (t) => t.playerId.toString() === player.id?.toString(),
              );
              return (
                <Grid item xs={12} sm={6} md={4} key={player.id}>
                  <Paper
                    className="moleskine-card"
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.secondary", minWidth: 40 }}>
                      {tp?.jerseyNumber || "-"}
                    </Typography>
                    <Avatar sx={{ bgcolor: player.avatarColor || "grey.500" }}>
                      {getInitials(player.name)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600 }}>{player.name}</Typography>
                  </Paper>
                </Grid>
              );
            })}
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
            <Box>
              <TextField
                fullWidth
                label="Logo URL"
                placeholder="https://example.com/logo.png"
                value={editLogoUrl}
                onChange={(e) => setEditLogoUrl(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                size="small"
                onClick={handleDetectColor}
                disabled={!editLogoUrl}
              >
                Auto-detect color from logo
              </Button>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Banner Primary Color
              </Typography>
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
              const isInTeam = !!tp;
              return (
                <ListItem
                  key={player.id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {isInTeam && (
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
                        variant={isInTeam ? "outlined" : "contained"}
                        color={isInTeam ? "error" : "primary"}
                        onClick={() =>
                          isInTeam
                            ? handleRemovePlayerFromTeam(player.id!.toString())
                            : handleAddPlayerToTeam(player.id!.toString())
                        }
                      >
                        {isInTeam ? "Remove" : "Add"}
                      </Button>
                    </Box>
                  }
                >
                  <Avatar
                    sx={{ bgcolor: player.avatarColor || "grey.500", mr: 2 }}
                  >
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
