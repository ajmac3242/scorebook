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
  const teamId = teamIdParam ? (isNaN(Number(teamIdParam)) ? teamIdParam : Number(teamIdParam)) : undefined;
  const navigate = useNavigate();

  const [statView, setStatView] = useState<"total" | "average">("total");
  const [openRosterDialog, setOpenRosterDialog] = useState(false);

  const team = useLiveQuery(
    () => (teamId !== undefined ? db.teams.get(teamId as any) : Promise.resolve(undefined)),
    [teamId]
  );

  const season = useLiveQuery(
    () => (team?.seasonId ? db.seasons.get(Number(team.seasonId)) : Promise.resolve(undefined)),
    [team?.seasonId]
  );

  const teamPlayers = useLiveQuery(
    () => (teamId !== undefined ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray() : Promise.resolve([])),
    [teamId]
  ) || [];

  const allPlayers = useLiveQuery(() => db.players.toArray()) || [];

  const teamPlayerDetails = useMemo(() => {
    const playerIds = teamPlayers.map((tp) => tp.playerId.toString());
    return allPlayers.filter((p) => playerIds.includes(p.id?.toString() || ""));
  }, [allPlayers, teamPlayers]);

  const games = useLiveQuery(
    () => (teamId !== undefined ? db.games.where("teamId").equals(teamId.toString()).toArray() : Promise.resolve([])),
    [teamId]
  ) || [];

  const gameIds = useMemo(() => games.map((g) => g.id).filter(Boolean), [games]);

  const allStats = useLiveQuery(
    () => (gameIds.length > 0 ? db.stats.where("gameId").anyOf(gameIds as any[]).toArray() : Promise.resolve([])),
    [gameIds]
  ) || [];

  const playerStats = useMemo(() => {
    const statsMap: Record<string, any> = {};

    teamPlayerDetails.forEach((p) => {
      statsMap[p.id!.toString()] = {
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        jerseyNumber: teamPlayers.find((tp) => tp.playerId.toString() === p.id!.toString())?.jerseyNumber || "",
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
      const data = statView === "total" ? p : {
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
        fgPct: p.attempts > 0 ? ((p.makes / p.attempts) * 100).toFixed(1) : "0.0",
      };
    });
  }, [teamPlayerDetails, allStats, teamPlayers, statView]);

  const handleAddPlayerToTeam = async (playerId: string) => {
    if (!teamId) return;
    const exists = teamPlayers.find((tp) => tp.playerId.toString() === playerId.toString());
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

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Paper className="moleskine-card" sx={{ p: 3, mb: 4, bgcolor: "var(--deep-ocean)", color: "white" }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" sx={{ fontFamily: "var(--serif)", fontWeight: 700 }}>
              {team?.name}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8 }}>
              {season?.name} | {games.length} Games
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenRosterDialog(true)}
              sx={{ bgcolor: "var(--golden-dune)", color: "var(--midnight)", "&:hover": { bgcolor: "#c5a272" } }}
            >
              Manage Roster
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>Player Breakdown</Typography>
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
                onClick={() => navigate(`/players/${row.id}?teamId=${teamId}&seasonId=${team?.seasonId}`)}
              >
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  {row.jerseyNumber || "-"}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: row.avatarColor || "grey.500", fontFamily: "var(--serif)" }}>
                      {getInitials(row.name)}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600 }}>{row.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{row.gp}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{row.points}</TableCell>
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
                  <Typography color="text.secondary">No players in this team roster.</Typography>
                  <Button startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setOpenRosterDialog(true)}>Add Players</Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openRosterDialog} onClose={() => setOpenRosterDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Team Roster</DialogTitle>
        <DialogContent>
          <List>
            {allPlayers.map((player) => {
              const tp = teamPlayers.find((t) => t.playerId.toString() === player.id?.toString());
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
                          onBlur={(e) => handleUpdateJersey(player.id!.toString(), e.target.value)}
                        />
                      )}
                      <Button
                        variant={isInTeam ? "outlined" : "contained"}
                        color={isInTeam ? "error" : "primary"}
                        onClick={() => (isInTeam ? handleRemovePlayerFromTeam(player.id!.toString()) : handleAddPlayerToTeam(player.id!.toString()))}
                      >
                        {isInTeam ? "Remove" : "Add"}
                      </Button>
                    </Box>
                  }
                >
                  <Avatar sx={{ bgcolor: player.avatarColor || 'grey.500', mr: 2 }}>{getInitials(player.name)}</Avatar>
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
