import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Chip,
  DialogContentText,
  Stack,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
  Undo as UndoIcon,
  RadioButtonChecked,
  History,
  Person,
  Check,
  Close,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  Edit,
  Delete,
  Shield,
  FlashOn,
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { ACTION_TYPES } from "../constants/stats";

const OPPONENT_PLAYER_ID = "OPPONENT";

const GameMode: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();

  const gameIdParam = searchParams.get("gameId");
  const gameId = gameIdParam
    ? isNaN(Number(gameIdParam))
      ? gameIdParam
      : Number(gameIdParam)
    : "practice-session";

  const teamIdParam = searchParams.get("teamId");
  const teamId = teamIdParam
    ? isNaN(Number(teamIdParam))
      ? teamIdParam
      : Number(teamIdParam)
    : null;

  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<
    number | string | null
  >(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);

  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<number | null>(null);

  const [onCourtIds, setOnCourtIds] = useState<Set<number | string>>(new Set());
  const [period, setPeriod] = useState(1);
  const [trackingMode, setTrackingMode] = useState<"TEAM" | "OPPONENT">("TEAM");

  const teamPlayers =
    useLiveQuery(
      () =>
        teamId
          ? db.teamPlayers.where("teamId").equals(teamId.toString()).toArray()
          : Promise.resolve([]),
      [teamId],
    ) || [];

  const players =
    useLiveQuery(async () => {
      try {
        await db.open();
        if (!teamId) return await db.players.toArray();

        const playerIds = teamPlayers.map((t) =>
          isNaN(Number(t.playerId)) ? t.playerId : Number(t.playerId),
        );
        return await db.players
          .where("id")
          .anyOf(playerIds as any)
          .toArray();
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
    }, [teamId, teamPlayers]) || [];

  const game = useLiveQuery(
    () =>
      gameId !== undefined
        ? db.games.get(gameId as any)
        : Promise.resolve(undefined),
    [gameId],
  );

  const recentStats =
    useLiveQuery(async () => {
      try {
        await db.open();
        const stats = await db.stats.where("gameId").equals(gameId).toArray();
        return stats
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 10);
      } catch (err) {
        console.error("Failed to fetch recent stats:", err);
        return [];
      }
    }, [gameId]) || [];

  const gameStats =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.stats.where("gameId").equals(gameId).toArray();
      } catch (err) {
        console.error("Failed to fetch game stats:", err);
        return [];
      }
    }, [gameId]) || [];

  const currentScore = gameStats
    .filter((s) => s.playerId !== OPPONENT_PLAYER_ID)
    .reduce((sum, s) => sum + (s.points || 0), 0);
  const opponentScore = gameStats
    .filter((s) => s.playerId === OPPONENT_PLAYER_ID)
    .reduce((sum, s) => sum + (s.points || 0), 0);

  const handleUndo = async () => {
    if (recentStats.length === 0) return;
    const lastStat = recentStats[0];
    if (lastStat.id) {
      try {
        await db.open();
        await db.stats.delete(lastStat.id);
      } catch (err) {
        console.error("Failed to undo stat:", err);
      }
    }
  };

  const handleCourtClick = (x: number, y: number) => {
    setSelectedX(x);
    setSelectedY(y);
    if (trackingMode === "OPPONENT") {
      setSelectedPlayerId(OPPONENT_PLAYER_ID);
    }
    setDialogOpen(true);
  };

  const handleSaveStat = async (currentType?: string) => {
    const typeToSave = currentType || statType;
    if (!selectedPlayerId || !typeToSave) return;

    try {
      await db.open();
      if (isEditing && editingStatId) {
        await db.stats.update(editingStatId, {
          playerId: selectedPlayerId,
          type: typeToSave,
          points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
        });
      } else {
        const newStat: StatEvent = {
          gameId: gameId,
          playerId: selectedPlayerId,
          type: typeToSave,
          points: typeToSave === ACTION_TYPES.MAKE ? points : 0,
          locationX: selectedX || 0,
          locationY: selectedY || 0,
          timestamp: new Date().toISOString(),
          synced: 0,
        };
        await db.stats.add(newStat);
      }
    } catch (err) {
      console.error("Failed to save stat:", err);
    }
    setDialogOpen(false);
    setStatType(null);
    setIsEditing(false);
    setEditingStatId(null);
    if (trackingMode === "OPPONENT") setSelectedPlayerId(null);
  };

  const toggleOnCourt = async (playerId: number | string) => {
    const newOnCourt = new Set(onCourtIds);
    const isNowOnCourt = !newOnCourt.has(playerId);

    if (isNowOnCourt) {
      newOnCourt.add(playerId);
    } else {
      newOnCourt.delete(playerId);
    }

    setOnCourtIds(newOnCourt);

    try {
      await db.open();
      await db.stats.add({
        gameId: gameId,
        playerId: playerId,
        type: isNowOnCourt ? ACTION_TYPES.SUB_IN : ACTION_TYPES.SUB_OUT,
        timestamp: new Date().toISOString(),
        synced: 0,
      });
    } catch (err) {
      console.error("Failed to record sub event:", err);
    }
  };

  const handleDeleteStat = async () => {
    if (!statToDelete) return;
    try {
      await db.open();
      await db.stats.delete(statToDelete);
      setDeleteDialogOpen(false);
      setStatToDelete(null);
    } catch (err) {
      console.error("Failed to delete stat:", err);
    }
  };

  const openEditDialog = (stat: StatEvent) => {
    setEditingStatId(stat.id ?? null);
    setSelectedPlayerId(stat.playerId);
    setStatType(stat.type);
    setPoints(stat.points || 2);
    setSelectedX(stat.locationX || 0);
    setSelectedY(stat.locationY || 0);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const QuickAction = ({ type, label, icon: Icon }: any) => (
    <Button
      variant={statType === type ? "contained" : "outlined"}
      color="inherit"
      onClick={() => {
        setStatType(type);
        if (type !== ACTION_TYPES.MAKE) handleSaveStat(type);
      }}
      sx={{
        flexDirection: "column",
        py: 2,
        minWidth: 80,
        borderColor: "#D1D1D1",
        backgroundColor: statType === type ? "primary.main" : "transparent",
        color: statType === type ? "white" : "text.primary",
      }}
    >
      <Icon sx={{ mb: 1 }} />
      <Typography variant="caption">{label}</Typography>
    </Button>
  );

  const getPlayerJersey = (pId?: number | string) => {
    if (!pId) return "";
    const tp = teamPlayers.find(
      (t) => t.playerId.toString() === pId.toString(),
    );
    return tp?.jerseyNumber || "";
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
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="moleskine-card" sx={{ p: 2 }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                  {game?.opponent ? `vs ${game.opponent}` : "Live Tracker"}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    label={`TEAM: ${currentScore}`}
                    color="primary"
                    sx={{ fontWeight: "bold" }}
                  />
                  <Chip
                    label={`OPP: ${opponentScore}`}
                    color="secondary"
                    sx={{ fontWeight: "bold" }}
                  />
                  <Chip
                    label={`P: ${period}`}
                    onClick={() => setPeriod((p) => (p < 4 ? p + 1 : 1))}
                    variant="outlined"
                  />
                </Stack>
              </Box>
              <ToggleButtonGroup
                value={trackingMode}
                exclusive
                onChange={(_, val) => val && setTrackingMode(val)}
                size="small"
              >
                <ToggleButton value="TEAM">Our Team</ToggleButton>
                <ToggleButton value="OPPONENT">Opponent</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              sx={{
                mb: 2,
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={recentStats.length === 0}
                sx={{ mr: 1 }}
              >
                Undo
              </Button>
              {["ALL", "MAKE", "MISS", "REBOUND", "ASSIST", "STEAL"].map(
                (type) => (
                  <Chip
                    key={type}
                    label={type}
                    onClick={() => setMarkerFilter(type)}
                    variant={markerFilter === type ? "filled" : "outlined"}
                    size="small"
                    color={markerFilter === type ? "primary" : "default"}
                  />
                ),
              )}
            </Box>

            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={gameStats
                .filter(
                  (s) => markerFilter === "ALL" || s.type === markerFilter,
                )
                .map((s) => ({
                  id: s.id,
                  x: s.locationX || 0,
                  y: s.locationY || 0,
                  type: s.type,
                  label:
                    s.playerId !== OPPONENT_PLAYER_ID
                      ? getPlayerJersey(s.playerId)
                      : undefined,
                  color:
                    s.playerId === OPPONENT_PLAYER_ID
                      ? theme.palette.secondary.main
                      : undefined,
                }))}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {trackingMode === "TEAM" ? (
              <Paper className="moleskine-card">
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Team Roster
                </Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {players.map((p) => (
                    <Box key={p.id} sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant={
                          selectedPlayerId === p.id ? "contained" : "outlined"
                        }
                        onClick={() => setSelectedPlayerId(p.id ?? null)}
                        sx={{
                          justifyContent: "flex-start",
                          bgcolor:
                            selectedPlayerId === p.id
                              ? "primary.main"
                              : "transparent",
                          color:
                            selectedPlayerId === p.id
                              ? "white"
                              : "text.primary",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.75rem",
                            mr: 1,
                            bgcolor: p.avatarColor || "grey.500",
                          }}
                        >
                          {getPlayerJersey(p.id)}
                        </Avatar>
                        {p.name}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => toggleOnCourt(p.id!)}
                        color={onCourtIds.has(p.id!) ? "primary" : "default"}
                      >
                        {onCourtIds.has(p.id!) ? (
                          <RemoveCircleOutline />
                        ) : (
                          <AddCircleOutline />
                        )}
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ) : (
              <Paper
                className="moleskine-card"
                sx={{
                  bgcolor: "secondary.light",
                  color: "secondary.contrastText",
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  Opponent Tracking
                </Typography>
                <Typography variant="body2">
                  Stats recorded in this mode will be assigned to the generic
                  "Opponent" player to track lead and flow.
                </Typography>
              </Paper>
            )}

            <Paper className="moleskine-card">
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <History sx={{ fontSize: 18, mr: 1 }} /> Recent Actions
              </Typography>
              <Stack spacing={1}>
                {recentStats.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.5,
                      borderBottom: "1px solid #F0F0F0",
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        <strong>
                          {s.playerId === OPPONENT_PLAYER_ID
                            ? "Opponent"
                            : players?.find((p) => p.id === s.playerId)?.name ||
                              "Unknown"}
                        </strong>
                        : {s.type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(s.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(s)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setStatToDelete(s.id ?? null);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          {isEditing ? "Edit Action" : "Record Action"}
          <Typography variant="body2" color="text.secondary">
            {selectedPlayerId === OPPONENT_PLAYER_ID
              ? "Opponent"
              : players?.find((p) => p.id === selectedPlayerId)?.name ||
                "Select Player"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            <QuickAction type={ACTION_TYPES.MAKE} label="Make" icon={Check} />
            <QuickAction type={ACTION_TYPES.MISS} label="Miss" icon={Close} />
            <QuickAction
              type={ACTION_TYPES.REBOUND}
              label="Rebound"
              icon={SportsBasketball}
            />
            <QuickAction
              type={ACTION_TYPES.STEAL}
              label="Steal"
              icon={FlashOn}
            />
            <QuickAction
              type={ACTION_TYPES.ASSIST}
              label="Assist"
              icon={PanTool}
            />
            <QuickAction
              type={ACTION_TYPES.TURNOVER}
              label="TO"
              icon={SwapHoriz}
            />
          </Box>

          {statType === ACTION_TYPES.MAKE && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Points
              </Typography>
              <Stack direction="row" spacing={1}>
                {[1, 2, 3].map((pts) => (
                  <Button
                    key={pts}
                    fullWidth
                    variant={points === pts ? "contained" : "outlined"}
                    onClick={() => setPoints(pts)}
                  >
                    {pts}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveStat()}
            variant="contained"
            disabled={!selectedPlayerId || !statType}
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this action?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteStat} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameMode;
