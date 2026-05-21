import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Groups as TeamsIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type StatEvent, type Team } from "../db";
import { useTeams } from "../hooks/useTeams";
import { logger } from "../utils/logger";
import { calculateTeamAggregates, getInitials } from "../utils/stats";
import { syncService } from "../utils/syncService";
import { useTokens } from "../theme/useTokens";
import {
  TokenPageShell,
  TokenSectionCard,
  TokenPageTitle,
} from "../components/layout/TokenLayout";

type TeamAggregateSummary = {
  record: string;
  ppg: string;
  rpg: string;
  apg: string;
  oppg: string;
};

const DEFAULT_TEAM_ACCENT = "#154C56";

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const buildTeamAccent = (teamColor?: string) => {
  const safe = isValidHex(teamColor) ? teamColor!.trim() : DEFAULT_TEAM_ACCENT;
  return {
    solid: safe,
    softBg: alpha(safe, 0.12),
    softerBg: alpha(safe, 0.08),
    border: alpha(safe, 0.24),
    ring: alpha(safe, 0.18),
  };
};

const StatCell: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "text.secondary",
          mb: 0.5,
          display: "block",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          lineHeight: 1,
          fontWeight: 700,
          color: "text.primary",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const Teams: React.FC = () => {
  const theme = useTheme();
  const tokens = useTokens();
  const navigate = useNavigate();

  const controlRadius = tokens.semantic.component.radius.button;
  const pageShell = tokens.semantic.component.pageShell;
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_TEAM_ACCENT);
  const [fouls, setFouls] = useState<number>(3);
  const [showValidation, setShowValidation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const teams = useTeams();

  const filteredTeams = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return teams;
    return teams.filter((team) => {
      const haystack = [
        team.name,
        team.description || "",
        team.periodType || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [teams, searchTerm]);

  const favoriteCount = useMemo(
    () => teams.filter((team) => team.isFavorite).length,
    [teams],
  );

  const teamIds = useMemo(
    () => teams.map((team) => team.id).filter(Boolean),
    [teams],
  );

  const allGamesQueryResult = useLiveQuery(() => {
    if (teamIds.length === 0) return [];
    return db.games
      .where("teamId")
      .anyOf(teamIds as string[])
      .toArray();
  }, [teamIds]);

  const allGames = useMemo(
    () => allGamesQueryResult || [],
    [allGamesQueryResult],
  );

  const gameIds = useMemo(
    () => allGames.map((game) => game.id).filter(Boolean),
    [allGames],
  );

  const allStatsQueryResult = useLiveQuery(() => {
    if (gameIds.length === 0) return [];
    return db.stats
      .where("gameId")
      .anyOf(gameIds as string[])
      .toArray();
  }, [gameIds]);

  const allStats = useMemo(
    () => allStatsQueryResult || [],
    [allStatsQueryResult],
  );

  const teamAggregatesMap = useMemo(() => {
    const gamesByTeam: Record<string, (typeof allGames)[0][]> = {};
    for (const game of allGames) {
      if (!gamesByTeam[game.teamId]) gamesByTeam[game.teamId] = [];
      gamesByTeam[game.teamId].push(game);
    }
    const statsByGame: Record<string, StatEvent[]> = {};
    for (const stat of allStats as StatEvent[]) {
      if (!statsByGame[stat.gameId]) statsByGame[stat.gameId] = [];
      statsByGame[stat.gameId].push(stat);
    }
    const results: Record<string, TeamAggregateSummary> = {};
    for (const team of teams) {
      const teamGames = gamesByTeam[team.id!] || [];
      const teamStats: StatEvent[] = teamGames.flatMap(
        (g) => statsByGame[g.id!] || [],
      );
      results[team.id!] = calculateTeamAggregates(
        teamGames,
        teamStats,
      ) as TeamAggregateSummary;
    }
    return results;
  }, [teams, allGames, allStats]);

  const closeDialog = () => {
    setOpen(false);
    setShowValidation(false);
  };

  const resetForm = () => {
    setTeamName("");
    setDescription("");
    setPeriodType("QUARTERS");
    setLogoUrl("");
    setPrimaryColor(DEFAULT_TEAM_ACCENT);
    setFouls(3);
    setShowValidation(false);
    setIsSubmitting(false);
  };

  const handleToggleFavorite = async (
    teamId: string,
    currentFavorite: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      if (!currentFavorite) {
        const allFavorites = await db.teams
          .where("isFavorite")
          .equals(1)
          .toArray();
        for (const favoriteTeam of allFavorites) {
          if (favoriteTeam.id !== teamId) {
            await db.teams.update(favoriteTeam.id!, {
              isFavorite: 0,
              synced: 0,
            });
          }
        }
        await db.teams.update(teamId, { isFavorite: 1, synced: 0 });
      } else {
        await db.teams.update(teamId, { isFavorite: 0, synced: 0 });
      }
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle favorite team", err, { teamId });
      setSnackbar({
        open: true,
        message: "Could not update favorite team",
        severity: "error",
      });
    }
  };

  const handleAddTeam = async () => {
    if (!teamName.trim() || fouls <= 0) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName.trim(),
        description: description.trim(),
        periodType,
        logoUrl: logoUrl.trim(),
        primaryColor: isValidHex(primaryColor)
          ? primaryColor.trim()
          : DEFAULT_TEAM_ACCENT,
        fouls,
        synced: 0,
      };
      await db.teams.add(newTeam);
      await syncService.pushUpdates();
      closeDialog();
      resetForm();
      setSnackbar({
        open: true,
        message: "Team created successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to add team", err, { teamName });
      setIsSubmitting(false);
      setSnackbar({
        open: true,
        message: "Failed to create team",
        severity: "error",
      });
    }
  };

  const emptyStateTitle = searchTerm
    ? `No teams matching "${searchTerm}"`
    : "No teams yet";
  const emptyStateDescription = searchTerm
    ? "Try a different search, clear the filter, or create a new team."
    : "Create your first team to start tracking performance, rosters, and game results.";

  const transitionAll = `transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`;

  return (
    <TokenPageShell id="main-content" sx={{ pb: 8 }}>
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

      <TokenSectionCard
        sx={{
          borderRadius: `${pageShell.radius}px`,
          border: pageShell.border,
          boxShadow: pageShell.shadow,
          bgcolor: pageShell.background,
          overflow: "hidden",
          p: 0,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box>
            <TokenPageTitle sx={{ mb: 0.5 }}>Teams</TokenPageTitle>
            <Typography variant="body2" color="text.secondary">
              Manage your basketball teams, review performance at a glance, and
              open team dashboards.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{
              borderRadius: controlRadius,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              flexShrink: 0,
            }}
          >
            Add team
          </Button>
        </Box>

        {/* Search + filter bar */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            flexShrink: 0,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "stretch", md: "center" },
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams"
              size="small"
              sx={{
                width: { xs: "100%", md: 320 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: "text.secondary", fontSize: 18 }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap" }}
            >
              <Chip
                label={`${teams.length} total`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              />
              <Chip
                label={`${favoriteCount} favorite`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: controlRadius,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              />
            </Stack>
          </Stack>
        </Box>

        {/* Content */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {filteredTeams.length === 0 ? (
            /* Empty state */
            <Box
              sx={{
                minHeight: 300,
                borderRadius: `${tokens.semantic.component.sectionCard.radius}px`,
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.hover",
                    color: "text.secondary",
                  }}
                >
                  <TeamsIcon sx={{ fontSize: 30 }} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    mb: 1,
                  }}
                >
                  {emptyStateTitle}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    lineHeight: 1.6,
                    maxWidth: 480,
                    mx: "auto",
                    mb: 2.5,
                  }}
                >
                  {emptyStateDescription}
                </Typography>
                {searchTerm ? (
                  <Button
                    variant="outlined"
                    onClick={() => setSearchTerm("")}
                    sx={{
                      borderRadius: controlRadius,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpen(true)}
                    sx={{
                      borderRadius: controlRadius,
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "none",
                    }}
                  >
                    Create first team
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            /* Team cards */
            <Grid container spacing={2.5}>
              {filteredTeams.map((team) => {
                const aggregates = teamAggregatesMap[team.id!] || {
                  record: "0-0",
                  ppg: "0.0",
                  rpg: "0.0",
                  apg: "0.0",
                  oppg: "0.0",
                };
                const accent = buildTeamAccent(team.primaryColor);
                const sectionCard = tokens.semantic.component.sectionCard;
                const inputRadius = tokens.semantic.component.radius.input;

                return (
                  <Grid size={{ xs: 12, md: 6, xl: 4 }} key={team.id}>
                    <Box
                      role="button"
                      tabIndex={0}
                      aria-label={`View team dashboard for ${team.name}`}
                      onClick={() => navigate(`/teams/${team.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/teams/${team.id}`);
                        }
                      }}
                      sx={{
                        position: "relative",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: `${sectionCard.radius}px`,
                        border: "1px solid",
                        borderColor: team.isFavorite
                          ? accent.border
                          : "divider",
                        bgcolor: "background.paper",
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: transitionAll,
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: theme.shadows[3],
                          borderColor: accent.border,
                        },
                        "&:focus-visible": {
                          outline: "none",
                          boxShadow: `0 0 0 3px ${accent.ring}`,
                          borderColor: accent.solid,
                        },
                      }}
                    >
                      {/* Team color bar */}
                      <Box
                        sx={{ height: 6, bgcolor: accent.solid, flexShrink: 0 }}
                      />

                      <Box
                        sx={{
                          p: 2.25,
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                        }}
                      >
                        {/* Name + avatar row */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center", mb: 0.75 }}
                            >
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color: "text.primary",
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {team.name}
                              </Typography>
                              <Tooltip
                                title={
                                  team.isFavorite
                                    ? "Remove from favorites"
                                    : "Mark as favorite"
                                }
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) =>
                                    handleToggleFavorite(
                                      team.id!,
                                      team.isFavorite || 0,
                                      e,
                                    )
                                  }
                                  sx={{
                                    p: 0.5,
                                    color: team.isFavorite
                                      ? accent.solid
                                      : "text.secondary",
                                    flexShrink: 0,
                                  }}
                                  aria-label={
                                    team.isFavorite
                                      ? `Remove ${team.name} from favorites`
                                      : `Mark ${team.name} as favorite`
                                  }
                                >
                                  {team.isFavorite ? (
                                    <StarIcon sx={{ fontSize: 18 }} />
                                  ) : (
                                    <StarBorderIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Stack>

                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                lineHeight: 1.5,
                                mb: 1.5,
                                minHeight: 42,
                              }}
                            >
                              {team.description?.trim() ||
                                "No description yet."}
                            </Typography>

                            <Chip
                              size="small"
                              label={
                                team.periodType === "HALVES"
                                  ? "Halves"
                                  : "Quarters"
                              }
                              sx={{
                                borderRadius: inputRadius,
                                bgcolor: accent.softerBg,
                                color: "text.primary",
                                border: `1px solid ${accent.border}`,
                                fontWeight: 600,
                              }}
                            />
                          </Box>

                          {team.logoUrl ? (
                            <Avatar
                              src={team.logoUrl}
                              variant="rounded"
                              sx={{
                                width: 56,
                                height: 56,
                                bgcolor: accent.softerBg,
                                border: `1px solid ${accent.border}`,
                                p: 0.5,
                                color: "text.primary",
                                borderRadius: `${tokens.semantic.shape.radius.md}px`,
                              }}
                            />
                          ) : (
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 56,
                                height: 56,
                                bgcolor: accent.softBg,
                                color: accent.solid,
                                border: `1px solid ${accent.border}`,
                                fontWeight: 700,
                                borderRadius: `${tokens.semantic.shape.radius.md}px`,
                              }}
                            >
                              {getInitials(team.name)}
                            </Avatar>
                          )}
                        </Box>

                        {/* Win-loss record */}
                        <Box
                          sx={{
                            borderRadius: `${sectionCard.radius}px`,
                            px: 2,
                            py: 1.75,
                            mb: 2,
                            bgcolor: "action.hover",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              lineHeight: 1,
                              fontWeight: 800,
                              color: "text.primary",
                              mb: 0.5,
                            }}
                          >
                            {aggregates.record}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: "text.secondary",
                            }}
                          >
                            Win-loss record
                          </Typography>
                        </Box>

                        {/* Stat cells */}
                        <Box
                          sx={{
                            mt: "auto",
                            pt: 2,
                            borderTop: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <StatCell label="PPG" value={aggregates.ppg} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <StatCell label="RPG" value={aggregates.rpg} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <StatCell label="APG" value={aggregates.apg} />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <StatCell label="OPPG" value={aggregates.oppg} />
                            </Grid>
                          </Grid>

                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                              alignItems: "center",
                              mt: 2,
                              color: accent.solid,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              Open team dashboard
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 16 }} />
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </TokenSectionCard>

      {/* Add team dialog */}
      <Dialog
        open={open}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: `${tokens.semantic.component.radius.dialog}px`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "text.primary" }}>
          Add new team
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              error={showValidation && !teamName.trim()}
              helperText={
                showValidation && !teamName.trim()
                  ? "Team name is required"
                  : " "
              }
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="period-type-label">Period type</InputLabel>
              <Select
                labelId="period-type-label"
                label="Period type"
                value={periodType}
                onChange={(e) =>
                  setPeriodType(e.target.value as "QUARTERS" | "HALVES")
                }
              >
                <MenuItem value="QUARTERS">Quarters</MenuItem>
                <MenuItem value="HALVES">Halves</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Logo URL"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Primary color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                error={showValidation && !isValidHex(primaryColor)}
                helperText={
                  showValidation && !isValidHex(primaryColor)
                    ? "Use a valid hex color like #154C56"
                    : " "
                }
                fullWidth
              />
              <Box sx={{ minWidth: { xs: "100%", sm: 72 } }}>
                <TextField
                  label=" "
                  type="color"
                  value={
                    isValidHex(primaryColor)
                      ? primaryColor
                      : DEFAULT_TEAM_ACCENT
                  }
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": { height: 56, p: 0.75 },
                    "& input": { p: 0, height: "100%", cursor: "pointer" },
                  }}
                />
              </Box>
            </Stack>
            <FormControl fullWidth error={showValidation && fouls <= 0}>
              <TextField
                label="Team fouls to bonus"
                type="number"
                value={fouls}
                onChange={(e) => setFouls(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1 } }}
                fullWidth
              />
              <FormHelperText>
                {showValidation && fouls <= 0
                  ? "Fouls must be greater than 0"
                  : " "}
              </FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={closeDialog}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddTeam}
            disabled={isSubmitting}
            sx={{
              borderRadius: controlRadius,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            {isSubmitting ? "Adding..." : "Add team"}
          </Button>
        </DialogActions>
      </Dialog>
    </TokenPageShell>
  );
};

export default Teams;
