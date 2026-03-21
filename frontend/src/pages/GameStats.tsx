import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tab,
  Tabs,
  Chip,
  useTheme,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { STAT_ACRONYMS, ACTION_TYPES } from "../constants/stats";
import { calculatePlayerAggregates, getPlayerJersey } from "../utils/stats";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const OPPONENT_PLAYER_ID = "OPPONENT";

const GameStats: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId") || undefined;

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string>(
    "ALL",
  );
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as any)
        : Promise.resolve(undefined),
    [gameId],
  );
  const teamPlayers =
    useLiveQuery(
      () =>
        game?.teamId
          ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
          : Promise.resolve([]),
      [game?.teamId],
    ) || [];
  const players = useLiveQuery(() => db.players.toArray()) || [];
  const stats =
    useLiveQuery(
      () =>
        gameId !== undefined
          ? db.stats.where("gameId").equals(gameId).toArray()
          : Promise.resolve([]),
      [gameId],
    ) || [];

  const playerAggregates = useMemo(
    () => calculatePlayerAggregates(players, stats, teamPlayers),
    [players, stats, teamPlayers],
  );

  const filteredStats = useMemo(() => {
    return stats.filter(
      (s) =>
        (selectedPlayerId === "ALL" || s.playerId === selectedPlayerId) &&
        (selectedType === "ALL" || s.type === selectedType),
    );
  }, [stats, selectedPlayerId, selectedType]);

  const scoreFlowData = useMemo(() => {
    let teamScore = 0,
      opponentScore = 0;
    const sortedStats = [...stats].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const data = sortedStats
      .filter((s) => s.type === ACTION_TYPES.MAKE)
      .map((s) => {
        s.playerId === OPPONENT_PLAYER_ID
          ? (opponentScore += s.points || 0)
          : (teamScore += s.points || 0);
        return {
          time: new Date(s.timestamp).toLocaleTimeString([], {
            minute: "2-digit",
            second: "2-digit",
          }),
          Team: teamScore,
          Opponent: opponentScore,
        };
      });
    return [{ time: "00:00", Team: 0, Opponent: 0 }, ...data];
  }, [stats]);

  const oppData = useMemo(() => {
    const oppStats = stats.filter((s) => s.playerId === OPPONENT_PLAYER_ID);
    const makes = oppStats.filter((s) => s.type === ACTION_TYPES.MAKE);
    const attempts =
      makes.length +
      oppStats.filter((s) => s.type === ACTION_TYPES.MISS).length;
    return {
      points: makes.reduce((sum, s) => sum + (s.points || 0), 0),
      makes: makes.length,
      attempts,
      fgPct:
        attempts > 0 ? ((makes.length / attempts) * 100).toFixed(1) : "0.0",
      rebounds: oppStats.filter((s) => s.type === ACTION_TYPES.REBOUND).length,
      assists: oppStats.filter((s) => s.type === ACTION_TYPES.ASSIST).length,
      steals: oppStats.filter((s) => s.type === ACTION_TYPES.STEAL).length,
      turnovers: oppStats.filter((s) => s.type === ACTION_TYPES.TURNOVER)
        .length,
    };
  }, [stats]);

  const boxScoreTable = (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableCell>PLAYER</TableCell>
            <TableCell align="right">PTS</TableCell>
            <TableCell align="right">FG</TableCell>
            <TableCell align="right">FG%</TableCell>
            <TableCell align="right">REB</TableCell>
            <TableCell align="right">AST</TableCell>
            <TableCell align="right">STL</TableCell>
            <TableCell align="right">TO</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {playerAggregates
            .filter((p) => p.attempts > 0 || p.rebounds > 0 || p.assists > 0)
            .map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor: row.avatarColor,
                    }}
                  >
                    {row.jerseyNumber}
                  </Avatar>
                  {row.name}
                </TableCell>
                <TableCell align="right">{row.points}</TableCell>
                <TableCell align="right">
                  {row.makes}-{row.attempts}
                </TableCell>
                <TableCell align="right">{row.fgPct}%</TableCell>
                <TableCell align="right">{row.rebounds}</TableCell>
                <TableCell align="right">{row.assists}</TableCell>
                <TableCell align="right">{row.steals}</TableCell>
                <TableCell align="right">{row.turnovers}</TableCell>
              </TableRow>
            ))}
          <TableRow sx={{ bgcolor: "secondary.light" }}>
            <TableCell sx={{ fontWeight: 700 }}>OPPONENT</TableCell>
            <TableCell align="right">{oppData.points}</TableCell>
            <TableCell align="right">
              {oppData.makes}-{oppData.attempts}
            </TableCell>
            <TableCell align="right">{oppData.fgPct}%</TableCell>
            <TableCell align="right">{oppData.rebounds}</TableCell>
            <TableCell align="right">{oppData.assists}</TableCell>
            <TableCell align="right">{oppData.steals}</TableCell>
            <TableCell align="right">{oppData.turnovers}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const shotChartFilters = (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Filters
      </Typography>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Player</InputLabel>
          <Select
            value={selectedPlayerId}
            label="Player"
            onChange={(e) => setSelectedPlayerId(e.target.value)}
          >
            <MenuItem value="ALL">All Players</MenuItem>
            {players.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            label="Type"
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <MenuItem value="ALL">All Shots</MenuItem>
            <MenuItem value="MAKE">Makes</MenuItem>
            <MenuItem value="MISS">Misses</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );

  const shotChartCourt = (
    <BasketballCourt
      markers={filteredStats
        .filter((s) => s.type === "MAKE" || s.type === "MISS")
        .map((s) => ({
          id: s.id,
          x: s.locationX || 0,
          y: s.locationY || 0,
          type: s.type,
          label:
            s.playerId !== OPPONENT_PLAYER_ID
              ? getPlayerJersey(s.playerId, teamPlayers)
              : undefined,
          playerId: s.playerId,
        }))}
      onMarkerClick={(m) => setSelectedPlayerId(m.playerId || "ALL")}
    />
  );

  const scoreFlowChart = (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={scoreFlowData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="stepAfter"
          dataKey="Team"
          stroke={theme.palette.primary.main}
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="stepAfter"
          dataKey="Opponent"
          stroke={theme.palette.secondary.main}
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title={game?.opponent ? `vs ${game.opponent}` : "Game Stats"}
        subtitle={`${game?.date || ""} | ${game?.location || ""}`}
      />

      <Grid container spacing={3}>
        {/* Box Score Card */}
        <Grid item xs={12}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Box Score
              </Typography>
              <IconButton onClick={() => setExpandedSection("boxScore")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            {boxScoreTable}
          </MoleskineCard>
        </Grid>

        {/* Shot Chart Card */}
        <Grid item xs={12} md={6}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Shot Chart
              </Typography>
              <IconButton onClick={() => setExpandedSection("shotChart")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            {shotChartFilters}
            <Box sx={{ p: 1 }}>{shotChartCourt}</Box>
          </MoleskineCard>
        </Grid>

        {/* Score Flow Card */}
        <Grid item xs={12} md={6}>
          <MoleskineCard>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Score Flow
              </Typography>
              <IconButton onClick={() => setExpandedSection("scoreFlow")}>
                <ExpandIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 400 }}>{scoreFlowChart}</Box>
          </MoleskineCard>
        </Grid>
      </Grid>

      {/* Expanded Section Dialog */}
      <Dialog
        fullWidth
        maxWidth="lg"
        open={expandedSection !== null}
        onClose={() => setExpandedSection(null)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {expandedSection === "boxScore" && "Box Score"}
          {expandedSection === "shotChart" && "Shot Chart"}
          {expandedSection === "scoreFlow" && "Score Flow"}
          <IconButton onClick={() => setExpandedSection(null)}>
            <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {expandedSection === "boxScore" && boxScoreTable}
          {expandedSection === "shotChart" && (
            <>
              {shotChartFilters}
              <Box sx={{ p: 1, maxWidth: 800, mx: "auto" }}>{shotChartCourt}</Box>
            </>
          )}
          {expandedSection === "scoreFlow" && (
            <Box sx={{ height: 500 }}>{scoreFlowChart}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandedSection(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameStats;
