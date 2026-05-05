import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Avatar,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  History,
  People as PlayersIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { getInitials, calculatePlayerAggregates } from "../utils/stats";
import { MoleskineCard, StatItem } from "../components/SharedUI";
import { useLiveQuery } from "dexie-react-hooks";
import { logger } from "../utils/logger";
import { AVATAR_COLORS } from "../constants/colors";
import EntityBanner from "../components/EntityBanner";
import { useNavigate } from "react-router-dom";

/**
 * Players page component.
 * Displays a list of all players and allows adding new player records.
 */
const Players: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [showValidation, setShowValidation] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Use live query directly to handle archived/deleted filtering
  const playersResult = useLiveQuery(() => {
    return db.players
      .toArray()
      .then((all) => {
        // Performance: Normalize search term once outside the loop
        const normalizedSearch = searchTerm.toLowerCase();
        return all.filter((p) => {
          if (p.deletedAt) return false;
          if (!showArchived && p.isArchived) return false;
          if (
            normalizedSearch &&
            !p.name.toLowerCase().includes(normalizedSearch)
          )
            return false;
          return true;
        });
      })
      .catch((err) => {
        logger.error("Failed to fetch players:", err);
        return [];
      });
  }, [showArchived, searchTerm]);

  const players = useMemo(() => playersResult || [], [playersResult]);

  const allStatsResult = useLiveQuery(() => db.stats.toArray());
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const playersWithStats = useMemo(() => {
    const aggregates = calculatePlayerAggregates(
      players,
      allStats,
      [],
      "average",
    );
    // Optimization: Create the map in a single pass using a for loop to avoid intermediate array allocation from map().
    const aggMap = new Map();
    for (let i = 0; i < aggregates.length; i++) {
      const a = aggregates[i];
      aggMap.set(a.id, a);
    }

    // Optimization: Use a standard map call to merge player data with their aggregates.
    return players.map((p) => {
      const agg = aggMap.get(p.id!);
      return {
        ...p,
        ppg: agg?.points || 0,
        rpg: agg?.rebounds || 0,
        apg: agg?.assists || 0,
      };
    });
  }, [players, allStats]);

  /**
   * Handles adding a new player record.
   */
  const handleAddPlayer = async () => {
    if (!name.trim()) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await db.players.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        avatarColor,
        isArchived: 0,
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpen(false);
      setName("");
      setAvatarColor(AVATAR_COLORS[0]);
      setShowValidation(false);
      setSnackbar({
        open: true,
        message: "Player added successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to add player", err, { name });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <EntityBanner
        title="Players"
        icon={<PlayersIcon />}
        backTo="/"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        actions={
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                inputProps={{ "aria-label": "Show archived players" }}
                sx={{
                  "& .MuiSwitch-track": { bgcolor: "rgba(255,255,255,0.3)" },
                }}
              />
            }
            label="Show Archived"
            sx={{ color: "white", mr: 0 }}
          />
        }
      />

      <Box sx={{ mt: 4 }} />

      <Grid container spacing={3}>
        {playersWithStats.map((player) => (
          <Grid item xs={12} sm={6} md={6} key={player.id}>
            <MoleskineCard
              role="button"
              tabIndex={0}
              aria-label={`${player.isArchived ? "Restore" : "View stats for"} ${player.name}`}
              sx={{
                cursor: "pointer",
                height: "100%",
                bgcolor: player.avatarColor || "grey.500",
                color: "white",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                },
                "&:focus-visible": {
                  outline: "4px solid #fff",
                  outlineOffset: "2px",
                  transform: "translateY(-4px)",
                },
                display: "flex",
                flexDirection: "column",
                p: 0,
                overflow: "hidden",
                border: "none",
                opacity: player.isArchived ? 0.7 : 1,
              }}
              onClick={() =>
                player.isArchived
                  ? handleRestorePlayer(player.id!)
                  : navigate(`/players/${player.id}`)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  player.isArchived
                    ? handleRestorePlayer(player.id!)
                    : navigate(`/players/${player.id}`);
                }
              }}
            >
              <Box sx={{ p: 3, flexGrow: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "var(--serif)",
                        fontWeight: 700,
                        mb: 0.5,
                        color: "white",
                      }}
                    >
                      {player.name}
                    </Typography>
                    {Boolean(player.isArchived) && (
                      <Chip
                        label="Archived"
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                        }}
                        icon={
                          <History
                            sx={{
                              fontSize: "12px !important",
                              color: "white !important",
                            }}
                          />
                        }
                      />
                    )}
                  </Box>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "white",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      border: "2px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {getInitials(player.name)}
                  </Avatar>
                </Box>
              </Box>

              <Box
                sx={{
                  bgcolor: "rgba(0,0,0,0.1)",
                  p: 2,
                  display: "flex",
                  justifyContent: "space-around",
                }}
              >
                <StatItem label="PPG" value={player.ppg} light />
                <Typography
                  sx={{ color: "white", opacity: 0.3, alignSelf: "center" }}
                >
                  |
                </Typography>
                <StatItem label="RPG" value={player.rpg} light />
                <Typography
                  sx={{ color: "white", opacity: 0.3, alignSelf: "center" }}
                >
                  |
                </Typography>
                <StatItem label="APG" value={player.apg} light />
              </Box>
            </MoleskineCard>
          </Grid>
        ))}
        {playersWithStats.length === 0 && (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: "center",
                py: 12,
                bgcolor: "rgba(0,0,0,0.02)",
                borderRadius: 4,
                border: "2px dashed rgba(0,0,0,0.1)",
              }}
            >
              <PlayersIcon
                sx={{
                  fontSize: 64,
                  color: "text.secondary",
                  opacity: 0.2,
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm
                  ? `No players matching "${searchTerm}"`
                  : `No ${showArchived ? "" : "active"} players found.`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Start by adding players to your roster"}
              </Typography>
              {searchTerm ? (
                <Button
                  variant="outlined"
                  onClick={() => setSearchTerm("")}
                  sx={{ borderRadius: 2 }}
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Your First Player
                </Button>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      <Tooltip title="Add New Player">
        <Fab
          color="primary"
          aria-label="add new player"
          sx={{
            position: "fixed",
            bottom: "calc(32px + env(safe-area-inset-bottom))",
            right: 32,
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.1) rotate(90deg)" },
          }}
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setShowValidation(false);
        }}
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Add New Player
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Player Name"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                handleAddPlayer();
              }
            }}
            sx={{ mb: 2, mt: 1 }}
            error={showValidation && !name.trim()}
            helperText={
              showValidation && !name.trim() ? "Player name is required" : ""
            }
            required
            disabled={isSubmitting}
          />
          <Typography variant="subtitle2" gutterBottom>
            Avatar Color
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {AVATAR_COLORS.map((color) => (
              <Tooltip key={color} title={`Select ${color.toUpperCase()}`}>
                <Box
                  onClick={() => setAvatarColor(color)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setAvatarColor(color);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select color ${color.toUpperCase()} as avatar color`}
                  aria-pressed={avatarColor === color}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: color,
                    cursor: "pointer",
                    border:
                      avatarColor === color
                        ? "3px solid #000"
                        : "1px solid rgba(0,0,0,0.1)",
                    boxSizing: "border-box",
                    transition: "all 0.1s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": { transform: "scale(1.2)" },
                    "&:focus-visible": {
                      outline: "2px solid #000",
                      outlineOffset: "2px",
                    },
                  }}
                >
                  {avatarColor === color && (
                    <CheckIcon sx={{ color: "#000", fontSize: 20 }} />
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Player"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
