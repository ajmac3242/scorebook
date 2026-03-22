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
} from "@mui/material";
import {
  Add as AddIcon,
  History,
  People as PlayersIcon,
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

  // Use live query directly to handle archived/deleted filtering
  const playersResult = useLiveQuery(async () => {
    const query = db.players.toCollection();
    const all = await query.toArray();
    return all.filter((p) => {
      if (p.deletedAt) return false;
      if (!showArchived && p.isArchived) return false;
      if (
        searchTerm &&
        !p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [showArchived, searchTerm]);

  const players = useMemo(() => playersResult || [], [playersResult]);

  const allStatsResult = useLiveQuery(() => db.stats.toArray());
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const playersWithStats = useMemo(() => {
    const aggregates = calculatePlayerAggregates(players, allStats, [], "average");
    return players.map(p => {
      const agg = aggregates.find(a => a.id === p.id);
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
    try {
      await db.open();
      await db.players.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        avatarColor,
        isArchived: 0,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpen(false);
      setName("");
      setAvatarColor(AVATAR_COLORS[0]);
      setShowValidation(false);
    } catch (err) {
      logger.error("Failed to add player", err, { name });
    }
  };

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <EntityBanner
        title="Players"
        icon={<PlayersIcon />}
        backTo="/"
        actions={
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                sx={{
                  "& .MuiSwitch-track": { bgcolor: "rgba(255,255,255,0.3)" },
                }}
              />
            }
            label="Show Archived"
            sx={{ color: "white" }}
          />
        }
      />

      <Box sx={{ mt: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Filter players by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 4, bgcolor: "white", borderRadius: 1 }}
        />
      </Box>

      <Grid container spacing={3}>
        {playersWithStats.map((player) => (
          <Grid item xs={12} sm={6} md={6} key={player.id}>
            <MoleskineCard
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
                display: "flex",
                flexDirection: "column",
                p: 0,
                overflow: "hidden",
                border: "none",
                opacity: player.isArchived ? 0.7 : 1,
              }}
              onClick={() => (player.isArchived ? handleRestorePlayer(player.id) : navigate(`/players/${player.id}`))}
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
                        sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                        icon={<History sx={{ fontSize: "12px !important", color: "white !important" }} />}
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
                <Typography sx={{ color: "white", opacity: 0.3, alignSelf: "center" }}>|</Typography>
                <StatItem label="RPG" value={player.rpg} light />
                <Typography sx={{ color: "white", opacity: 0.3, alignSelf: "center" }}>|</Typography>
                <StatItem label="APG" value={player.apg} light />
              </Box>
            </MoleskineCard>
          </Grid>
        ))}
        {playersWithStats.length === 0 && (
          <Grid item xs={12}>
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 8 }}
            >
              {searchTerm
                ? `No players matching "${searchTerm}"`
                : `No ${showArchived ? "" : "active"} players found.`}
            </Typography>
          </Grid>
        )}
      </Grid>

      <Fab
        color="primary"
        aria-label="add"
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
            sx={{ mb: 2, mt: 1 }}
            error={showValidation && !name.trim()}
            helperText={
              showValidation && !name.trim() ? "Player name is required" : ""
            }
            required
          />
          <Typography variant="subtitle2" gutterBottom>
            Avatar Color
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {AVATAR_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setAvatarColor(color)}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: color,
                  cursor: "pointer",
                  border: avatarColor === color ? "3px solid #000" : "none",
                  boxSizing: "border-box",
                  transition: "transform 0.1s",
                  "&:hover": { transform: "scale(1.2)" },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={!name}
          >
            Add Player
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default Players;
