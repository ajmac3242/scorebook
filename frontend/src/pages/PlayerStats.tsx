import React, { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import {
  calculatePlayerAggregates,
  getInitials,
  getPlayerJersey,
} from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

const PlayerStats: React.FC = () => {
  const { playerId: playerIdParam } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  // Support both numeric (Dexie) and string (UUID) IDs
  const playerId = playerIdParam
    ? isNaN(Number(playerIdParam))
      ? playerIdParam
      : Number(playerIdParam)
    : undefined;

  const [searchParams] = useSearchParams();
  const teamIdParam = searchParams.get("teamId");
  const seasonIdParam = searchParams.get("seasonId");

  const [selectedSeasonId, setSelectedSeasonId] = useState<number | string>(
    seasonIdParam
      ? isNaN(Number(seasonIdParam))
        ? seasonIdParam
        : Number(seasonIdParam)
      : "",
  );
  const [selectedGameId, setSelectedGameId] = useState<number | string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const AVATAR_COLORS = [
    "#4E7D5B",
    "#A64444",
    "#5A7381",
    "#154C56",
    "#D9B382",
    "#1F2D33",
    "#7B68EE",
    "#FF8C00",
  ];

  const player = useLiveQuery(
    () =>
      playerId ? db.players.get(playerId as any) : Promise.resolve(undefined),
    [playerId],
  );
  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const teams =
    useLiveQuery(
      async () =>
        selectedSeasonId
          ? db.teams
              .where("seasonId")
              .equals(selectedSeasonId.toString())
              .toArray()
          : [],
      [selectedSeasonId],
    ) || [];

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
        return [await db.games.get(Number(selectedGameId))].filter(
          Boolean,
        ) as any[];
      if (teams.length > 0)
        return db.games
          .where("teamId")
          .anyOf(teams.map((t) => t.id?.toString()).filter(Boolean) as string[])
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
      if (
        selectedGameId !== "" &&
        Number(stat.gameId) !== Number(selectedGameId)
      )
        return false;
      if (selectedType !== "" && stat.type !== selectedType) return false;
      if (
        selectedSeasonId !== "" &&
        selectedGameId === "" &&
        !games.some((g) => g.id === Number(stat.gameId))
      )
        return false;
      return true;
    });
  }, [allStats, selectedGameId, selectedType, selectedSeasonId, games]);

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

  const getJerseyNumber = () => {
    if (teamIdParam) {
      const tp = teamPlayers.find(
        (t) => t.teamId.toString() === teamIdParam.toString(),
      );
      return tp?.jerseyNumber || "";
    }
    return "";
  };

  const StatCard = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <Card sx={{ bgcolor: "#FFFDF5", border: "1px solid #D1D1D1" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          p: 4,
          mb: 4,
          borderRadius: "8px",
          bgcolor: player?.avatarColor || "var(--palette-deep-ocean)",
          color: "white",
          position: "relative",
          overflow: "hidden",
          transition: "background-color 0.3s ease",
        }}
      >
        <IconButton
          onClick={() => navigate("/players")}
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
            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  bgcolor: "rgba(255,255,255,0.2)",
                  fontSize: "3rem",
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              >
                {player ? getInitials(player.name) : ""}
              </Avatar>
              {getJerseyNumber() && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "var(--palette-golden-dune)",
                    color: "var(--palette-midnight)",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    border: "3px solid white",
                  }}
                >
                  {getJerseyNumber()}
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 700,
                color: "white",
              }}
            >
              {player?.name}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, color: "white" }}>
              {teamIdParam
                ? teams.find((t) => t.id?.toString() === teamIdParam)?.name
                : "Career Stats"}
            </Typography>
          </Grid>
        </Grid>

        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
          }}
        >
          <Button
            variant="outlined"
            size="small"
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
        </Box>
      </Box>

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

      <MoleskineCard sx={{ mb: 3 }}>
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
              onChange={(e) =>
                setSelectedGameId(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
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
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Game</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStats
                  .slice()
                  .reverse()
                  .map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        {new Date(stat.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {games.find((g) => g.id === Number(stat.gameId))
                          ?.opponent || "Unknown"}
                      </TableCell>
                      <TableCell>{stat.type}</TableCell>
                      <TableCell>{stat.points || 0}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayerStats;
