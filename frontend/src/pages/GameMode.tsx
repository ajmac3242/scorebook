import React, { useState, useEffect } from "react";
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
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  AddCircleOutline,
  RemoveCircleOutline,
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
} from "@mui/icons-material";
import { DialogContentText } from "@mui/material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const GameMode: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isIPad = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const queryParams = new URLSearchParams(window.location.search);
  const gameIdParam = queryParams.get("gameId");
  const gameId = gameIdParam ? (isNaN(Number(gameIdParam)) ? gameIdParam : Number(gameIdParam)) : "practice-session";

  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);

  const [markerFilter, setMarkerFilter] = useState<string>("ALL");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statToDelete, setStatToDelete] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatId, setEditingStatId] = useState<number | null>(null);

  const players =
    useLiveQuery(async () => {
      try {
        await db.open();
        return await db.players.toArray();
      } catch (err) {
        console.error("Failed to fetch players:", err);
        return [];
      }
    }) || [];

  const recentStats =
    useLiveQuery(async () => {
      try {
        await db.open();
        const stats = await db.stats
          .where("gameId")
          .equals(gameId)
          .toArray();
        return stats
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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

  const handleCourtClick = (x: number, y: number) => {
    setSelectedX(x);
    setSelectedY(y);
    // If player is already selected, move to stat selection
    if (selectedPlayerId) {
      setDialogOpen(true);
    } else {
      // Maybe show a hint to select player first or just open dialog
      setDialogOpen(true);
    }
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
          points: typeToSave === "MAKE" ? points : 0,
        });
      } else {
        const newStat: StatEvent = {
          gameId: gameId,
          playerId: selectedPlayerId,
          type: typeToSave,
          points: typeToSave === "MAKE" ? points : 0,
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

  const QuickAction = ({ type, label, icon: Icon, color }: any) => (
    <Button
      variant={statType === type ? "contained" : "outlined"}
      color="inherit"
      onClick={() => {
        setStatType(type);
        if (type !== "MAKE") handleSaveStat(type);
      }}
      sx={{
        flexDirection: "column",
        py: 2,
        minWidth: 80,
        borderColor: "#D1D1D1",
        backgroundColor: statType === type ? "#2D2D2D" : "transparent",
        color: statType === type ? "#FFFDF5" : "#2D2D2D",
      }}
    >
      <Icon sx={{ mb: 1 }} />
      <Typography variant="caption">{label}</Typography>
    </Button>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={3}>
        {/* Court Area */}
        <Grid item xs={12} md={8}>
          <Paper className="moleskine-card" sx={{ p: 1, position: "relative" }}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 1,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)" }}>
                Live Game Tracker
              </Typography>
              {selectedPlayerId && (
                <Chip
                  label={`Recording for: ${players?.find((p) => p.id?.toString() === selectedPlayerId)?.name || "Unknown"}`}
                  onDelete={() => setSelectedPlayerId(null)}
                  color="primary"
                />
              )}
            </Box>
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {["ALL", "MAKE", "MISS", "REBOUND", "ASSIST", "STEAL", "TURNOVER"].map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => setMarkerFilter(type)}
                  variant={markerFilter === type ? "contained" : "outlined"}
                  size="small"
                  sx={{
                    bgcolor: markerFilter === type ? "#2D2D2D" : "transparent",
                    color: markerFilter === type ? "#FFFDF5" : "#2D2D2D",
                  }}
                />
              ))}
            </Box>
            <BasketballCourt
              onCoordClick={handleCourtClick}
              markers={gameStats
                .filter(s => markerFilter === "ALL" || s.type === markerFilter)
                .map((s) => ({
                  id: s.id,
                  x: s.locationX || 0,
                  y: s.locationY || 0,
                  type: s.type,
                }))}
            />
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                display: "block",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Tap court to record event location
            </Typography>
          </Paper>
        </Grid>

        {/* Sidebar / Controls */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Player Selection */}
            <Paper className="moleskine-card">
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Active Lineup
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1,
                }}
              >
                {players.map((p) => (
                  <Button
                    key={p.id}
                    variant={
                      selectedPlayerId === p.id
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      setSelectedPlayerId(p.id ?? null)
                    }
                    sx={{
                      justifyContent: "flex-start",
                      px: 1,
                      py: 1,
                      borderColor: "#D1D1D1",
                      backgroundColor:
                        selectedPlayerId === p.id
                          ? "#2D2D2D"
                          : "transparent",
                      color:
                        selectedPlayerId === p.id
                          ? "#FFFDF5"
                          : "#2D2D2D",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: "0.75rem",
                        mr: 1,
                        bgcolor:
                          selectedPlayerId === p.id
                            ? "#FFFDF5"
                            : "#2D2D2D",
                        color:
                          selectedPlayerId === p.id
                            ? "#2D2D2D"
                            : "#FFFDF5",
                      }}
                    >
                      {p.defaultNumber}
                    </Avatar>
                    <Typography variant="body2" noWrap>
                      {p.name}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Paper>

            {/* Recent Activity */}
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
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        <strong>
                          {players?.find((p) => p.id === s.playerId)
                            ?.name || "Unknown"}
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
                        sx={{ color: "text.secondary" }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setStatToDelete(s.id ?? null);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{ color: "text.secondary" }}
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

      {/* Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setIsEditing(false);
          setEditingStatId(null);
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", pb: 1 }}>
          {isEditing ? "Edit Action" : "Record Action"}
          <Typography variant="body2" color="text.secondary">
            {selectedPlayerId
              ? `Player: ${players?.find((p) => p.id === selectedPlayerId)?.name || "Unknown"}`
              : "Select Player"}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {!selectedPlayerId && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Select Player First
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                }}
              >
                {players.map((p) => (
                  <Button
                    key={p.id}
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setSelectedPlayerId(p.id ?? null)
                    }
                    sx={{ borderColor: "#D1D1D1", color: "#2D2D2D" }}
                  >
                    #{p.defaultNumber}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          <Typography
            variant="caption"
            gutterBottom
            sx={{ display: "block", mb: 1 }}
          >
            What happened?
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
            }}
          >
            <QuickAction type="MAKE" label="Make" icon={Check} />
            <QuickAction type="MISS" label="Miss" icon={Close} />
            <QuickAction
              type="REBOUND"
              label="Rebound"
              icon={SportsBasketball}
            />
            <QuickAction type="STEAL" label="Steal" icon={RadioButtonChecked} />
            <QuickAction type="ASSIST" label="Assist" icon={PanTool} />
            <QuickAction type="TURNOVER" label="TO" icon={SwapHoriz} />
          </Box>

          {statType === "MAKE" && (
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
                    sx={{
                      borderColor: "#D1D1D1",
                      backgroundColor:
                        points === pts ? "#2D2D2D" : "transparent",
                      color: points === pts ? "#FFFDF5" : "#2D2D2D",
                    }}
                  >
                    {pts}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setIsEditing(false);
              setEditingStatId(null);
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveStat()}
            variant="contained"
            disabled={!selectedPlayerId || !statType}
            sx={{ px: 4 }}
          >
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this action? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteStat}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameMode;
