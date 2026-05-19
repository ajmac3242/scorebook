import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Check as CheckIcon,
  History,
  People as PlayersIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db";
import { syncService } from "../utils/syncService";
import { calculatePlayerAggregates, getInitials } from "../utils/stats";
import { logger } from "../utils/logger";
import { AVATAR_COLORS } from "../constants/colors";

type PlayerWithStats = {
  id?: string;
  name: string;
  avatarColor?: string;
  isArchived?: number;
  isStar?: number;
  ppg: number;
  rpg: number;
  apg: number;
};

const Players: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const radius = theme.shape.borderRadius;
  const shellRadius = radius * 1.5;
  const sectionRadius = radius * 1.5;
  const controlRadius = radius * 1.25;

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

  const playersResult = useLiveQuery(() => {
    return db.players
      .toArray()
      .then((all) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return all.filter((player) => {
          if (player.deletedAt) return false;
          if (!showArchived && player.isArchived) return false;
          if (
            normalizedSearch &&
            !player.name.toLowerCase().includes(normalizedSearch)
          ) {
            return false;
          }
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

  const playersWithStats = useMemo<PlayerWithStats[]>(() => {
    const aggregates = calculatePlayerAggregates(
      players,
      allStats,
      [],
      "average",
    );

    const aggregateMap = new Map();
    for (let i = 0; i < aggregates.length; i++) {
      const aggregate = aggregates[i];
      aggregateMap.set(aggregate.id, aggregate);
    }

    return players.map((player) => {
      const aggregate = aggregateMap.get(player.id!);
      return {
        ...player,
        ppg: aggregate?.points || 0,
        rpg: aggregate?.rebounds || 0,
        apg: aggregate?.assists || 0,
      };
    });
  }, [players, allStats]);

  const starCount = useMemo(
    () => playersWithStats.filter((player) => player.isStar).length,
    [playersWithStats],
  );

  const archivedCount = useMemo(
    () => playersWithStats.filter((player) => player.isArchived).length,
    [playersWithStats],
  );

  const resetForm = () => {
    setName("");
    setAvatarColor(AVATAR_COLORS[0]);
    setShowValidation(false);
    setIsSubmitting(false);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setShowValidation(false);
  };

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
      resetForm();

      setSnackbar({
        open: true,
        message: "Player added successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to add player", err, { name });
      setSnackbar({
        open: true,
        message: "Failed to add player",
        severity: "error",
      });
      setIsSubmitting(false);
    }
  };

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      await syncService.pushUpdates();

      setSnackbar({
        open: true,
        message: "Player restored",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
      setSnackbar({
        open: true,
        message: "Failed to restore player",
        severity: "error",
      });
    }
  };

  const handleToggleStar = async (
    e: React.MouseEvent,
    id: string,
    currentIsStar: number | undefined,
  ) => {
    e.stopPropagation();

    try {
      await db.players.update(id, {
        isStar: currentIsStar ? 0 : 1,
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle star player status", err, { id });
      setSnackbar({
        open: true,
        message: "Failed to update star player",
        severity: "error",
      });
    }
  };

  const emptyStateTitle = searchTerm
    ? `No players matching "${searchTerm}"`
    : showArchived
      ? "No players yet"
      : "No active players";

  const emptyStateDescription = searchTerm
    ? "Try a different search or clear the filter."
    : showArchived
      ? "Add your first player to start tracking individual performance."
      : "You have no active players right now. Try showing archived players or add a new player.";

  const getAccentStyles = (accentColor?: string) => {
    const accent = accentColor || theme.palette.primary.main;

    return {
      accent,
      accentSoft: alpha(accent, 0.12),
      accentSoftStrong: alpha(accent, 0.18),
      accentBorder: alpha(accent, 0.3),
      accentFocus: alpha(accent, 0.22),
    };
  };

  const statLabelSx = {
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "text.secondary",
    mb: 0.5,
    fontFamily: theme.typography.body2.fontFamily,
  };

  const statValueSx = {
    fontSize: "1.5rem",
    lineHeight: 1,
    fontWeight: 700,
    color: "text.primary",
    fontFamily: theme.typography.h4.fontFamily,
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

      <Paper
        elevation={0}
        sx={{
          borderRadius: shellRadius,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.default",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: controlRadius,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.18),
                  flexShrink: 0,
                }}
              >
                <PlayersIcon fontSize="small" />
              </Box>

              <Box>
                <Typography variant="h4" sx={{ mb: 0.25 }}>
                  Players
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your roster, highlight star players, and open
                  individual dashboards.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              aria-label="add new player"
              onClick={() => setOpen(true)}
              sx={{
                borderRadius: controlRadius,
                px: 2,
                boxShadow: "none",
                flexShrink: 0,
              }}
            >
              Add player
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", lg: "center" }}
            justifyContent="space-between"
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players"
              size="small"
              sx={{
                width: { xs: "100%", md: 320 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: "text.secondary", fontSize: 18 }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                label={`${playersWithStats.length} shown`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <Chip
                label={`${starCount} starred`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <Chip
                label={`${archivedCount} archived`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    inputProps={{ "aria-label": "show archived players" }}
                  />
                }
                label="Show archived"
                sx={{
                  ml: { xs: 0, sm: 0.5 },
                  mr: 0,
                  color: "text.secondary",
                  "& .MuiFormControlLabel-label": {
                    fontSize: "0.875rem",
                    fontFamily: theme.typography.body2.fontFamily,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {playersWithStats.length === 0 ? (
            <Box
              sx={{
                minHeight: 320,
                borderRadius: sectionRadius,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 3,
                py: 6,
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    mx: "auto",
                    mb: 2,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "action.hover",
                    color: "text.secondary",
                  }}
                >
                  <PlayersIcon />
                </Box>

                <Typography variant="h6" sx={{ mb: 1 }}>
                  {emptyStateTitle}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 480, mx: "auto", mb: 3 }}
                >
                  {emptyStateDescription}
                </Typography>

                {searchTerm ? (
                  <Button
                    variant="outlined"
                    onClick={() => setSearchTerm("")}
                    sx={{ borderRadius: controlRadius }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{ borderRadius: controlRadius, boxShadow: "none" }}
                  >
                    Create first player
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {playersWithStats.map((player) => {
                const {
                  accent,
                  accentSoft,
                  accentSoftStrong,
                  accentBorder,
                  accentFocus,
                } = getAccentStyles(player.avatarColor);

                return (
                  <Grid size={{ xs: 12, md: 6 }} xl={4} key={player.id}>
                    <Paper
                      role="button"
                      tabIndex={0}
                      elevation={0}
                      aria-label={
                        player.isArchived
                          ? `Restore ${player.name}`
                          : `View player dashboard for ${player.name}`
                      }
                      onClick={() =>
                        player.isArchived
                          ? handleRestorePlayer(player.id!)
                          : navigate(`/players/${player.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (player.isArchived) {
                            handleRestorePlayer(player.id!);
                          } else {
                            navigate(`/players/${player.id}`);
                          }
                        }
                      }}
                      sx={{
                        height: "100%",
                        borderRadius: sectionRadius,
                        border: "1px solid",
                        borderColor: player.isStar ? accentBorder : "divider",
                        bgcolor: "background.paper",
                        overflow: "hidden",
                        cursor: "pointer",
                        opacity: player.isArchived ? 0.72 : 1,
                        transition: theme.transitions.create(
                          [
                            "transform",
                            "box-shadow",
                            "border-color",
                            "background-color",
                          ],
                          { duration: theme.transitions.duration.shorter },
                        ),
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[3],
                          borderColor: accentBorder,
                        },
                        "&:focus-visible": {
                          outline: "none",
                          boxShadow: `0 0 0 3px ${accentFocus}`,
                          borderColor: accent,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: 6,
                          bgcolor: accent,
                        }}
                      />

                      <Box
                        sx={{
                          p: { xs: 2, sm: 2.25 },
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 2,
                            mb: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mb: 0.75, flexWrap: "wrap" }}
                            >
                              <Typography variant="h6">
                                {player.name}
                              </Typography>

                              {Boolean(player.isArchived) && (
                                <Chip
                                  label="Archived"
                                  size="small"
                                  icon={<History />}
                                  sx={{
                                    borderRadius: controlRadius,
                                    bgcolor: "action.hover",
                                    color: "text.secondary",
                                    "& .MuiChip-icon": {
                                      color: "text.secondary",
                                    },
                                  }}
                                />
                              )}

                              {Boolean(player.isStar) && (
                                <Chip
                                  label="Starred"
                                  size="small"
                                  sx={{
                                    borderRadius: controlRadius,
                                    bgcolor: accentSoft,
                                    color: "text.primary",
                                    border: "1px solid",
                                    borderColor: accentBorder,
                                  }}
                                />
                              )}
                            </Stack>

                            <Typography variant="body2" color="text.secondary">
                              {player.isArchived
                                ? "Archived player. Select to restore to the active roster."
                                : "Track player performance and open detailed individual stats."}
                            </Typography>
                          </Box>

                          <Stack spacing={1} alignItems="flex-end">
                            <Tooltip
                              title={
                                player.isStar
                                  ? "Remove star player"
                                  : "Mark as star player"
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handleToggleStar(e, player.id!, player.isStar)
                                }
                                aria-label={
                                  player.isStar
                                    ? `Remove ${player.name} from starred players`
                                    : `Mark ${player.name} as star player`
                                }
                                sx={{
                                  color: player.isStar
                                    ? accent
                                    : "text.secondary",
                                  bgcolor: player.isStar
                                    ? accentSoft
                                    : "transparent",
                                  "&:hover": {
                                    bgcolor: accentSoftStrong,
                                  },
                                }}
                              >
                                {player.isStar ? (
                                  <StarIcon sx={{ fontSize: 18 }} />
                                ) : (
                                  <StarBorderIcon sx={{ fontSize: 18 }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            <Avatar
                              sx={{
                                width: 56,
                                height: 56,
                                bgcolor: accentSoft,
                                color: accent,
                                border: "1px solid",
                                borderColor: accentBorder,
                                fontWeight: 700,
                              }}
                            >
                              {getInitials(player.name)}
                            </Avatar>
                          </Stack>
                        </Box>

                        <Box
                          sx={{
                            borderRadius: sectionRadius,
                            px: 2,
                            py: 1.75,
                            mb: 2,
                            bgcolor: "action.hover",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography sx={statLabelSx}>
                            Average stats
                          </Typography>

                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 4 }}>
                              <Typography sx={statLabelSx}>PPG</Typography>
                              <Typography sx={statValueSx}>
                                {player.ppg}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Typography sx={statLabelSx}>RPG</Typography>
                              <Typography sx={statValueSx}>
                                {player.rpg}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                              <Typography sx={statLabelSx}>APG</Typography>
                              <Typography sx={statValueSx}>
                                {player.apg}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            mt: "auto",
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {player.isArchived
                              ? "Restore player"
                              : "Open player dashboard"}
                          </Typography>

                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: accent,
                              border: "1px solid",
                              borderColor: alpha(
                                theme.palette.common.black,
                                0.08,
                              ),
                              flexShrink: 0,
                            }}
                          />
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Paper>

      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: shellRadius,
          },
        }}
      >
        <DialogTitle>Add Player</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="Player Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={showValidation && !name.trim()}
              helperText={
                showValidation && !name.trim() ? "Player name is required" : " "
              }
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPlayer();
                }
              }}
            />

            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary", mb: 1.25 }}
              >
                Avatar color
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                {AVATAR_COLORS.map((color) => {
                  const selected = avatarColor === color;

                  return (
                    <Tooltip
                      title={selected ? "Selected color" : color}
                      key={color}
                    >
                      <Box
                        role="button"
                        tabIndex={0}
                        aria-label={`Select avatar color ${color}`}
                        onClick={() => setAvatarColor(color)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setAvatarColor(color);
                          }
                        }}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          bgcolor: color,
                          cursor: "pointer",
                          border: "2px solid",
                          borderColor: selected ? "text.primary" : "divider",
                          display: "grid",
                          placeItems: "center",
                          transition: theme.transitions.create(
                            ["transform", "box-shadow", "border-color"],
                            { duration: theme.transitions.duration.shorter },
                          ),
                          "&:hover": {
                            transform: "scale(1.06)",
                          },
                          "&:focus-visible": {
                            outline: "none",
                            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
                          },
                        }}
                      >
                        {selected && (
                          <CheckIcon
                            sx={{
                              color: "#fff",
                              fontSize: 18,
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={handleDialogClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPlayer}
            variant="contained"
            disabled={isSubmitting}
            sx={{ boxShadow: "none" }}
          >
            {isSubmitting ? "Adding..." : "Add player"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Players;
