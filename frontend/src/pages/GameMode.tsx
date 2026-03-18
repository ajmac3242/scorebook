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
} from "@mui/icons-material";
import BasketballCourt from "../components/BasketballCourt";
import { db, type StatEvent } from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const GameMode: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isIPad = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [selectedX, setSelectedX] = useState<number | null>(null);
  const [selectedY, setSelectedY] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [statType, setStatType] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(2);

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
        return await db.stats.orderBy("timestamp").reverse().limit(5).toArray();
      } catch (err) {
        console.error("Failed to fetch recent stats:", err);
        return [];
      }
    }) || [];

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

  const handleSaveStat = async () => {
    if (!selectedPlayerId || !statType) return;

    const gameId =
      new URLSearchParams(window.location.search).get("gameId") ||
      "practice-session";

    const newStat: StatEvent = {
      gameId: gameId,
      playerId: selectedPlayerId,
      type: statType,
      points: statType === "MAKE" ? points : 0,
      locationX: selectedX || 0,
      locationY: selectedY || 0,
      timestamp: new Date().toISOString(),
      synced: 0,
    };

    try {
      await db.open();
      await db.stats.add(newStat);
    } catch (err) {
      console.error("Failed to save stat:", err);
    }
    setDialogOpen(false);
    setStatType(null);
    // Keep selectedPlayerId for consecutive actions by same player?
    // Usually yes, like a rebound after a miss, but let's clear for now to be safe
    // setSelectedPlayerId(null);
  };

  const QuickAction = ({ type, label, icon: Icon, color }: any) => (
    <Button
      variant={statType === type ? "contained" : "outlined"}
      color="inherit"
      onClick={() => {
        setStatType(type);
        if (type !== "MAKE") handleSaveStat();
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
            <BasketballCourt onCoordClick={handleCourtClick} />
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
                      selectedPlayerId === p.id?.toString()
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() =>
                      setSelectedPlayerId(p.id?.toString() || null)
                    }
                    sx={{
                      justifyContent: "flex-start",
                      px: 1,
                      py: 1,
                      borderColor: "#D1D1D1",
                      backgroundColor:
                        selectedPlayerId === p.id?.toString()
                          ? "#2D2D2D"
                          : "transparent",
                      color:
                        selectedPlayerId === p.id?.toString()
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
                          selectedPlayerId === p.id?.toString()
                            ? "#FFFDF5"
                            : "#2D2D2D",
                        color:
                          selectedPlayerId === p.id?.toString()
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
                    <Typography variant="body2">
                      <strong>
                        {players?.find((p) => p.id?.toString() === s.playerId)
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
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Action Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)", pb: 1 }}>
          Record Action
          <Typography variant="body2" color="text.secondary">
            {selectedPlayerId
              ? `Player: ${players?.find((p) => p.id?.toString() === selectedPlayerId)?.name || "Unknown"}`
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
                      setSelectedPlayerId(p.id?.toString() || null)
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
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveStat}
            variant="contained"
            disabled={!selectedPlayerId || !statType}
            sx={{ px: 4 }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameMode;
