import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Avatar,
  IconButton,
} from "@mui/material";
import { Delete, Edit as EditIcon } from "@mui/icons-material";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useOverlayState as useDisclosure,
  Select,
  ListBoxItem,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import { db, Player, StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import {
  calculatePlayerAggregates,
  calculateOpponentAggregates,
  calculateScoreFlow,
  isOpponentId,
  isActive,
  calculateLineupStats,
} from "../utils/stats";
import { formatClock } from "../utils/mathUtils";
import { PageHeader, AppCard, StatItem } from "../components/SharedUI";
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

const GameStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get("gameId");
  const theme = useTheme();

  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const {
    isOpen: isDeleteOpen,
    open: onDeleteOpen,
    close: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isEditSubOpen,
    open: onEditSubOpen,
    close: onEditSubClose,
  } = useDisclosure();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Substitution Audit State
  const [editingSub, setEditingSub] = useState<StatEvent | null>(null);
  const [editSubClock, setEditSubClock] = useState("");
  const [editSubPlayerId, setEditSubPlayerId] = useState("");

  const game = useLiveQuery(
    () => (gameId ? db.games.get(gameId) : undefined),
    [gameId],
  );
  const team = useLiveQuery(
    () => (game?.teamId ? db.teams.get(game.teamId) : undefined),
    [game?.teamId],
  );
  const stats = useLiveQuery(
    () =>
      gameId
        ? db.stats.where("gameId").equals(gameId).filter(isActive).toArray()
        : [],
    [gameId],
  );
  const players = useLiveQuery(
    () =>
      game?.teamId
        ? db.teamPlayers.where("teamId").equals(game.teamId).toArray()
        : [],
    [game?.teamId],
  );

  const filteredStats = useMemo(() => {
    if (!stats) return [];
    if (selectedPeriod === "all") return stats;
    return stats.filter((s) => s.period === parseInt(selectedPeriod));
  }, [stats, selectedPeriod]);

  const playerStats = useMemo(() => {
    if (!players || !stats) return [];
    const mappedPlayers: Player[] = players.map((tp) => ({
      id: tp.playerId,
      name: tp.name || "Unknown",
      avatarColor: tp.avatarColor,
    }));
    return calculatePlayerAggregates(mappedPlayers, stats);
  }, [players, stats]);

  const teamTotals = useMemo(() => {
    if (!stats)
      return {
        points: 0,
        rebounds: 0,
        assists: 0,
        makes: 0,
        attempts: 0,
        fgPct: "0.0",
      };
    let points = 0,
      rebounds = 0,
      assists = 0,
      makes = 0,
      attempts = 0;
    stats.forEach((s) => {
      if (
        s.playerId !== SPECIAL_PLAYER_IDS.OPPONENT &&
        !isOpponentId(s.playerId)
      ) {
        if (s.type === ACTION_TYPES.MAKE) {
          points += s.points || 2;
          makes++;
          attempts++;
        } else if (s.type === ACTION_TYPES.MISS) {
          attempts++;
        } else if (
          s.type === ACTION_TYPES.REBOUND ||
          s.type === ACTION_TYPES.OFF_REBOUND ||
          s.type === ACTION_TYPES.DEF_REBOUND
        ) {
          rebounds++;
        } else if (s.type === ACTION_TYPES.ASSIST) {
          assists++;
        }
      }
    });
    const fgPct = attempts > 0 ? ((makes / attempts) * 100).toFixed(1) : "0.0";
    return { points, rebounds, assists, makes, attempts, fgPct };
  }, [stats]);

  const oppData = useMemo(
    () => (stats ? calculateOpponentAggregates(stats) : null),
    [stats],
  );

  const scoreFlowData = useMemo(
    () => (stats ? calculateScoreFlow(stats) : []),
    [stats],
  );

  const lineupStats = useMemo(() => {
    if (!stats || !players || !game) return [];
    return calculateLineupStats(stats, {
      periodLength: game.periodLength || 10,
    });
  }, [stats, players, game]);

  // Play Efficiency Calculation
  const playStats = useMemo(() => {
    if (!stats) return [];
    const plays: Record<
      string,
      { attempts: number; makes: number; points: number }
    > = {};

    stats.forEach((s) => {
      if (
        s.playName &&
        (s.type === ACTION_TYPES.MAKE || s.type === ACTION_TYPES.MISS)
      ) {
        if (!plays[s.playName])
          plays[s.playName] = { attempts: 0, makes: 0, points: 0 };
        plays[s.playName].attempts += 1;
        if (s.type === ACTION_TYPES.MAKE) {
          plays[s.playName].makes += 1;
          plays[s.playName].points += s.points || 2;
        }
      }
    });

    return Object.entries(plays)
      .map(([name, data]) => ({
        name,
        ...data,
        fgPct:
          data.attempts > 0
            ? ((data.makes / data.attempts) * 100).toFixed(1)
            : "0.0",
        ppp:
          data.attempts > 0 ? (data.points / data.attempts).toFixed(2) : "0.00",
      }))
      .sort((a, b) => b.points - a.points);
  }, [stats]);

  // Substitution Timeline
  const subTimeline = useMemo(() => {
    if (!stats) return [];
    return stats
      .filter(
        (s) =>
          s.type === ACTION_TYPES.SUB_IN || s.type === ACTION_TYPES.SUB_OUT,
      )
      .sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period;
        return (b.clockTime || 0) - (a.clockTime || 0);
      });
  }, [stats]);

  const handleDeleteStat = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await db.stats.update(deleteId, { deletedAt: new Date().toISOString() });
      setDeleteId(null);
      onDeleteClose();
    } catch (error) {
      console.error("Failed to delete stat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSub = (sub: StatEvent) => {
    setEditingSub(sub);
    setEditSubClock(formatClock(sub.clockTime || 0));
    setEditSubPlayerId(sub.playerId);
    onEditSubOpen();
  };

  const saveSubEdit = async () => {
    if (!editingSub || !editingSub.id) return;

    const parts = editSubClock.split(":");
    let newSeconds = 0;
    if (parts.length === 2) {
      newSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else {
      newSeconds = parseInt(parts[0]);
    }

    try {
      await db.stats.update(editingSub.id, {
        clockTime: newSeconds,
        playerId: editSubPlayerId,
      });
      onEditSubClose();
    } catch (err) {
      console.error("Failed to update sub:", err);
    }
  };

  if (!game) return <Typography p={4}>Loading game data...</Typography>;

  const periods = game.periodType === "QUARTERS" ? [1, 2, 3, 4] : [1, 2];

  return (
    <Box sx={{ pb: 8 }}>
      <PageHeader
        title={`vs ${game.opponent}`}
        subtitle={`${game.date} @ ${game.location}`}
        showBack
        backTo={`/teams/detail?teamId=${game.teamId}`}
      />

      <Box sx={{ px: { xs: 2, sm: 4 } }}>
        <Grid container spacing={3}>
          {/* Main Scoreboard */}
          <Grid item xs={12}>
            <AppCard className="bg-primary text-white overflow-hidden border-none">
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={5} textAlign="center">
                  <Typography variant="overline" sx={{ opacity: 0.8 }}>
                    {team?.name || "OUR TEAM"}
                  </Typography>
                  <Typography variant="h2" fontWeight="900">
                    {teamTotals.points}
                  </Typography>
                </Grid>
                <Grid item xs={2} textAlign="center">
                  <Typography
                    variant="h4"
                    fontWeight="300"
                    sx={{ opacity: 0.5 }}
                  >
                    VS
                  </Typography>
                </Grid>
                <Grid item xs={5} textAlign="center">
                  <Typography variant="overline" sx={{ opacity: 0.8 }}>
                    {game.opponent}
                  </Typography>
                  <Typography variant="h2" fontWeight="900">
                    {oppData?.points || 0}
                  </Typography>
                </Grid>
              </Grid>
            </AppCard>
          </Grid>

          {/* Quick Stats Grid */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <AppCard>
                  <StatItem label="Team FG%" value={`${teamTotals.fgPct}%`} />
                </AppCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <AppCard>
                  <StatItem label="Opp FG%" value={`${oppData?.fgPct || 0}%`} />
                </AppCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <AppCard>
                  <StatItem label="Total REB" value={teamTotals.rebounds} />
                </AppCard>
              </Grid>
              <Grid item xs={6} sm={3}>
                <AppCard>
                  <StatItem label="Total AST" value={teamTotals.assists} />
                </AppCard>
              </Grid>
            </Grid>
          </Grid>

          {/* Scoring Flow Chart */}
          <Grid item xs={12} md={8}>
            <AppCard>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Scoring Flow
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      label={{
                        value: "Game Time",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      label={{
                        value: "Points",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="stepAfter"
                      dataKey="teamScore"
                      name={team?.name || "Our Team"}
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="oppScore"
                      name={game.opponent}
                      stroke={theme.palette.secondary.main}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </AppCard>
          </Grid>

          {/* Play Efficiency */}
          <Grid item xs={12} md={4}>
            <AppCard>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Play Efficiency
              </Typography>
              {playStats.length > 0 ? (
                <Table aria-label="Play efficiency table">
                  <TableHeader>
                    <TableColumn>SET/PLAY</TableColumn>
                    <TableColumn>FG%</TableColumn>
                    <TableColumn>PPP</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {playStats.map((play) => (
                      <TableRow key={play.name}>
                        <TableCell className="font-bold">{play.name}</TableCell>
                        <TableCell>{play.fgPct}%</TableCell>
                        <TableCell>
                          <Chip variant="soft">{play.ppp}</Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box
                  sx={{ py: 4, textAlign: "center", color: "text.secondary" }}
                >
                  No tagged plays recorded for this game.
                </Box>
              )}
            </AppCard>
          </Grid>

          {/* Box Score */}
          <Grid item xs={12}>
            <AppCard>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                  Player Performance
                </Typography>
                <Tabs
                  selectedKey={selectedPeriod}
                  onSelectionChange={(key) => setSelectedPeriod(key as string)}
                >
                  <Tab key="all">
                    <></>
                  </Tab>
                  {periods.map((p) => (
                    <Tab key={p.toString()}>
                      <></>
                    </Tab>
                  ))}
                </Tabs>
              </Box>
              <Table aria-label="Player box score">
                <TableHeader>
                  <TableColumn>PLAYER</TableColumn>
                  <TableColumn>PTS</TableColumn>
                  <TableColumn>REB</TableColumn>
                  <TableColumn>AST</TableColumn>
                  <TableColumn>FG%</TableColumn>
                  <TableColumn>3P%</TableColumn>
                  <TableColumn>FT%</TableColumn>
                  <TableColumn>+/-</TableColumn>
                </TableHeader>
                <TableBody>
                  {playerStats.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.75rem",
                              mr: 1,
                              bgcolor: row.avatarColor || "primary.main",
                            }}
                          >
                            {row.jerseyNumber}
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {row.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="font-bold">{row.points}</TableCell>
                      <TableCell>{row.rebounds}</TableCell>
                      <TableCell>{row.assists}</TableCell>
                      <TableCell>{row.fgPct}%</TableCell>
                      <TableCell>{row.threePct}%</TableCell>
                      <TableCell>{row.ftPct}%</TableCell>
                      <TableCell>
                        <span
                          className={
                            row.plusMinus > 0
                              ? "text-success font-bold"
                              : row.plusMinus < 0
                                ? "text-danger font-bold"
                                : ""
                          }
                        >
                          {row.plusMinus > 0
                            ? `+${row.plusMinus}`
                            : row.plusMinus}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AppCard>
          </Grid>

          {/* Lineup Efficiency */}
          <Grid item xs={12}>
            <AppCard>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Lineup Analysis (Top 5 by Minutes)
              </Typography>
              <Table aria-label="Lineup efficiency table">
                <TableHeader>
                  <TableColumn>LINEUP</TableColumn>
                  <TableColumn>MIN</TableColumn>
                  <TableColumn>+/-</TableColumn>
                  <TableColumn>NET/40</TableColumn>
                </TableHeader>
                <TableBody>
                  {lineupStats.slice(0, 5).map((lineup, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {lineup.lineup.map((pId) => {
                            const p = players?.find(
                              (player) => player.playerId === pId,
                            );
                            return (
                              <Chip key={pId} variant="soft">
                                {p?.jerseyNumber || "?"}
                              </Chip>
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>{(lineup.seconds / 60).toFixed(1)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            lineup.pointsFor - lineup.pointsAgainst > 0
                              ? "text-success font-bold"
                              : lineup.pointsFor - lineup.pointsAgainst < 0
                                ? "text-danger font-bold"
                                : ""
                          }
                        >
                          {lineup.pointsFor - lineup.pointsAgainst > 0
                            ? `+${lineup.pointsFor - lineup.pointsAgainst}`
                            : lineup.pointsFor - lineup.pointsAgainst}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(
                          ((lineup.pointsFor - lineup.pointsAgainst) /
                            (lineup.seconds || 1)) *
                          2400
                        ).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AppCard>
          </Grid>

          {/* Substitution Timeline Audit */}
          <Grid item xs={12}>
            <AppCard>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Substitution Audit Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Verify and correct substitution timing and personnel.
              </Typography>
              <Table aria-label="Substitution timeline table">
                <TableHeader>
                  <TableColumn>PERIOD</TableColumn>
                  <TableColumn>CLOCK</TableColumn>
                  <TableColumn>ACTION</TableColumn>
                  <TableColumn>PLAYER</TableColumn>
                  <TableColumn>EDIT</TableColumn>
                </TableHeader>
                <TableBody>
                  {subTimeline.map((sub) => {
                    const player = players?.find(
                      (p) => p.playerId === sub.playerId,
                    );
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>P{sub.period}</TableCell>
                        <TableCell className="tabular-nums">
                          {formatClock(sub.clockTime || 0)}
                        </TableCell>
                        <TableCell>
                          <Chip variant="soft">{sub.type}</Chip>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: "0.6rem",
                                mr: 1,
                                bgcolor: player?.avatarColor,
                              }}
                            >
                              {player?.jerseyNumber}
                            </Avatar>
                            {player?.name || "Unknown"}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSub(sub)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AppCard>
          </Grid>

          {/* Raw Actions List */}
          <Grid item xs={12}>
            <AppCard>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Game Events
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {filteredStats
                  .slice()
                  .reverse()
                  .map((stat) => (
                    <Box
                      key={stat.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 1,
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {isOpponentId(stat.playerId)
                            ? `${game.opponent} (${stat.playerId.split(":")[1] || "Team"})`
                            : players?.find((p) => p.playerId === stat.playerId)
                                ?.name || "Team"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.type} - P{stat.period} @{" "}
                          {formatClock(stat.clockTime || 0)}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeleteId(stat.id!);
                            onDeleteOpen();
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </AppCard>
          </Grid>
        </Grid>
      </Box>

      {/* Edit Substitution Dialog */}
      <Modal isOpen={isEditSubOpen} onOpenChange={onEditSubClose}>
        <ModalHeader>Edit Substitution</ModalHeader>
        <ModalBody>
          <Input
            placeholder="e.g. 8:00"
            defaultValue={editSubClock}
            onChange={(e) => setEditSubClock(e.target.value)}
          />
          <Select
            placeholder="Select a player"
            selectedKey={editSubPlayerId}
            onSelectionChange={(key) => setEditSubPlayerId(key as string)}
          >
            {(players || []).map((p) => (
              <ListBoxItem key={p.playerId!} textValue={p.name}>
                {`#${p.jerseyNumber} ${p.name}`}
              </ListBoxItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={onEditSubClose}>
            Cancel
          </Button>
          <Button onPress={saveSubEdit}>Save Changes</Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteClose}>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>
          <p>
            Are you sure you want to delete this game event? This will affect
            all statistics.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={onDeleteClose}
            isDisabled={isDeleting}
          >
            Cancel
          </Button>
          <Button onPress={handleDeleteStat}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
};

export default GameStats;
