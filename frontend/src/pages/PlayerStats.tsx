import React, { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
} from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { calculatePlayerAggregates } from "../utils/stats";
import { MoleskineCard, StatCard } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";
import { useSeasons } from "../hooks/useSeasons";
import { useTeams } from "../hooks/useTeams";
import { AVATAR_COLORS } from "../constants/colors";
import { Warning } from "@mui/icons-material";
import dayjs from "dayjs";

/**
 * PlayerStats page component.
 * Displays career and season-specific statistics for an individual player,
 * including a shot chart and a detailed action log.
 */
const PlayerStats: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();

  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");
  const seasonIdParam = searchParams.get("seasonId");

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    seasonIdParam || "",
  );
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  const player = useLiveQuery(
    () =>
      playerId ? db.players.get(playerId as any) : Promise.resolve(undefined),
    [playerId],
  );

  useEffect(() => {
    if (player?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(player.deletedAt).add(24, "hour");
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
  }, [player?.deletedAt]);

  // Use shared hooks
  const seasons = useSeasons();
  const teams = useTeams(selectedSeasonId);

  const teamPlayers =
    useLiveQuery(
      () =>
        playerId
          ? db.teamPlayers
              .where("playerId")
              .equals(playerId.toString())
              .toArray()
          : Promise.resolve([]),
      [playerId],
    ) || [];

  const games =
    useLiveQuery(async () => {
      if (selectedGameId)
        return [await db.games.get(selectedGameId)].filter(Boolean) as any[];
      if (teams.length > 0)
        return db.games
          .where("teamId")
          .anyOf(teams.map((t) => t.id!).filter(Boolean))
          .toArray();
      return db.games.toArray();
    }, [selectedGameId, teams]) || [];

  const allStats =
    useLiveQuery(
      () =>
        playerId !== undefined
          ? db.stats.where("playerId").equals(playerId).toArray()
          : Promise.resolve([]),
      [playerId],
    ) || [];

  const filteredStats = useMemo(() => {
    return allStats.filter((stat) => {
      if (selectedGameId !== "" && stat.gameId !== selectedGameId) return false;
      if (selectedType !== "" && stat.type !== selectedType) return false;
      if (
        selectedSeasonId !== "" &&
        selectedGameId === "" &&
        !games.some((g) => g.id === stat.gameId)
      )
        return false;
      return true;
    });
  }, [allStats, selectedGameId, selectedType, selectedSeasonId, games]);

  /**
   * Updates player-level metadata.
   */
  const handleUpdatePlayer = async () => {
    if (!playerId) return;
    await db.players.update(playerId as any, {
      name: editName,
      avatarColor: editColor,
      synced: 0,
    });
    setOpenEditDialog(false);
  };

  const aggregates = useMemo(() => {
    const res = calculatePlayerAggregates(
      [player].filter(Boolean),
      filteredStats,
    );
    return (
      res[0] || {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        turnovers: 0,
        fgPct: "0.0",
        makes: 0,
        attempts: 0,
      }
    );
  }, [player, filteredStats]);

  /**
   * Retrieves the jersey number for the current player within the filtered team context.
   */
  const getJerseyNumber = () => {
    if (teamIdParam) {
      const tp = teamPlayers.find(
        (t) => t.teamId.toString() === teamIdParam.toString(),
      );
      return tp?.jerseyNumber || "";
    }
    return "";
  };

  const isDeleted = !!player?.deletedAt;

  return (
    <Box sx={{ pb: 4, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={player?.name || "Player"}
        subtitle={
          teamIdParam
            ? teams.find((t) => t.id?.toString() === teamIdParam)?.name
            : "Career Stats"
        }
        avatarColor={player?.avatarColor}
        backTo="/players"
        primaryColor={player?.avatarColor}
        jerseyNumber={getJerseyNumber()}
        stats={[
          { label: "PTS", value: aggregates.points },
          { label: "FG%", value: `${aggregates.fgPct}%` },
          { label: "REB", value: aggregates.rebounds },
          { label: "AST", value: aggregates.assists },
        ]}
        actions={
          <Button
            variant="outlined"
            size="small"
            disabled={isDeleted}
            onClick={() => {
              setEditName(player?.name || "");
              setEditColor(player?.avatarColor || "#154C56");
              setOpenEditDialog(true);
            }}
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Edit Player
          </Button>
        }
      />

      {isDeleted && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 4, mt: 3 }}>
          <AlertTitle>Pending Deletion</AlertTitle>
          This player is scheduled for deletion in <strong>{timeLeft}</strong>. Restore them from the Players list.
        </Alert>
      )}

      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit Player Details</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Player Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Avatar Color
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {AVATAR_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setEditColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: editColor === color ? "3px solid #000" : "none",
                      boxSizing: "border-box",
                      "&:hover": { transform: "scale(1.1)" },
                      transition: "transform 0.1s",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdatePlayer}
            variant="contained"
            disabled={!editName}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <MoleskineCard sx={{ mb: 3, mt: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Season</InputLabel>
            <Select
              value={selectedSeasonId}
              label="Season"
              onChange={(e) => {
                setSelectedSeasonId(e.target.value);
                setSelectedGameId("");
              }}
            >
              <MenuItem value="">All Seasons</MenuItem>
              {seasons.map((s) => (
                <MenuItem key={s.id} value={s.id!}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Game</InputLabel>
            <Select
              value={selectedGameId}
              label="Game"
              onChange={(e) => setSelectedGameId(e.target.value as string)}
            >
              <MenuItem value="">All Games</MenuItem>
              {games.map((g) => (
                <MenuItem key={g.id} value={g.id!}>
                  {g.opponent} ({g.date})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Action Type</InputLabel>
            <Select
              value={selectedType}
              label="Action Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="MAKE">Makes</MenuItem>
              <MenuItem value="MISS">Misses</MenuItem>
              <MenuItem value="REBOUND">Rebounds</MenuItem>
              <MenuItem value="ASSIST">Assists</MenuItem>
              <MenuItem value="STEAL">Steals</MenuItem>
              <MenuItem value="TURNOVER">Turnovers</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </MoleskineCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <StatCard label="Total Points" value={aggregates.points} />
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <StatCard label="FG%" value={`${aggregates.fgPct}%`} />
              <StatCard
                label="FG"
                value={`${aggregates.makes}/${aggregates.attempts}`}
              />
              <StatCard label="REB" value={aggregates.rebounds} />
              <StatCard label="AST" value={aggregates.assists} />
              <StatCard label="STL" value={aggregates.steals} />
              <StatCard label="TO" value={aggregates.turnovers} />
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <MoleskineCard sx={{ p: 1 }}>
            <BasketballCourt
              markers={filteredStats.map((s) => ({
                id: s.id,
                x: s.locationX || 0,
                y: s.locationY || 0,
                type: s.type,
              }))}
            />
          </MoleskineCard>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={MoleskineCard}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Game</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Points
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStats
                  .slice()
                  .reverse()
                  .map((stat) => {
                    const g = games.find((g) => g.id === stat.gameId);
                    // We don't have season type here easily without querying for each stat,
                    // so we'll just show the number for now.
                    return (
                      <TableRow key={stat.id} hover>
                        <TableCell>
                          P{stat.period || 1}
                        </TableCell>
                        <TableCell>
                          {g?.opponent || "Unknown"}
                        </TableCell>
                        <TableCell>{stat.type}</TableCell>
                        <TableCell align="right">{stat.points || 0}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayerStats;
