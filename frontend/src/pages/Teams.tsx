import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Grid,
  Avatar,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Groups as TeamsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { db, type Team, type StatEvent } from "../db";
import { syncService } from "../utils/syncService";
import { useNavigate } from "react-router-dom";
import { MoleskineCard, StatItem } from "../components/SharedUI";
import { logger } from "../utils/logger";
import { useTeams } from "../hooks/useTeams";
import { useLiveQuery } from "dexie-react-hooks";
import { calculateTeamAggregates, getInitials } from "../utils/stats";
import EntityBanner from "../components/EntityBanner";

const contrastColorCache: Record<string, "white" | "black"> = {};

/**
 * Calculates luminance to determine if text should be white or black for a given background color.
 * Memoized to avoid redundant calculations in list renders.
 * @param {string} hexcolor - Hex color string.
 * @returns {"white" | "black"} Contrast color.
 */
const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return "white";
  if (contrastColorCache[hexcolor]) return contrastColorCache[hexcolor];

  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  const result = yiq >= 128 ? "black" : "white";

  contrastColorCache[hexcolor] = result;
  return result;
};

/**
 * Teams page component.
 * Displays a list of teams and provides a way to add new teams.
 */
const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#154C56");
  const [fouls, setFouls] = useState<number>(3);
  const [showValidation, setShowValidation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  // Use shared hooks for data fetching
  const teams = useTeams();

  const filteredTeams = useMemo(() => {
    // Performance: Normalize search term once outside the loop
    const normalizedSearch = searchTerm.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(normalizedSearch));
  }, [teams, searchTerm]);

  // Fetch all games and stats for the visible teams to calculate aggregates
  const teamIds = useMemo(
    () => teams.map((t) => t.id).filter(Boolean),
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
    () => (allGames || []).map((g) => g.id).filter(Boolean),
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

  // Pre-calculate team aggregates to avoid O(N^2) filtering in the render loop.
  const teamAggregatesMap = useMemo(() => {
    const gamesByTeam: Record<string, (typeof allGames)[0][]> = {};
    for (let i = 0; i < allGames.length; i++) {
      const g = allGames[i];
      if (!gamesByTeam[g.teamId]) gamesByTeam[g.teamId] = [];
      gamesByTeam[g.teamId].push(g);
    }

    const statsByGame: Record<string, StatEvent[]> = {};
    for (let i = 0; i < allStats.length; i++) {
      const s = allStats[i] as StatEvent;
      if (!statsByGame[s.gameId]) statsByGame[s.gameId] = [];
      statsByGame[s.gameId].push(s);
    }

    const results: Record<
      string,
      ReturnType<typeof calculateTeamAggregates>
    > = {};
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const teamGames = gamesByTeam[team.id!] || [];
      // Optimization: Manually collect stats for the team to avoid creating intermediate arrays with flatMap.
      const teamStats: StatEvent[] = [];
      for (let j = 0; j < teamGames.length; j++) {
        const gStats = statsByGame[teamGames[j].id!];
        if (gStats) {
          for (let k = 0; k < gStats.length; k++) {
            teamStats.push(gStats[k]);
          }
        }
      }
      results[team.id!] = calculateTeamAggregates(teamGames, teamStats);
    }
    return results;
  }, [teams, allGames, allStats]);

  /**
   * Toggles the favorite status of a team.
   * Ensures only one team can be marked as favorite at a time.
   * @param {string} teamId - The ID of the team to toggle.
   * @param {number} currentFavorite - Current favorite status (0 or 1).
   */
  const handleToggleFavorite = async (
    teamId: string,
    currentFavorite: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      if (!currentFavorite) {
        // We are marking this team as favorite. Unmark all others.
        const allFavorites = await db.teams
          .where("isFavorite")
          .equals(1)
          .toArray();
        for (const f of allFavorites) {
          if (f.id !== teamId) {
            await db.teams.update(f.id!, { isFavorite: 0, synced: 0 });
          }
        }
        await db.teams.update(teamId, { isFavorite: 1, synced: 0 });
      } else {
        await db.teams.update(teamId, { isFavorite: 0, synced: 0 });
      }
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle favorite team", err, { teamId });
    }
  };

  /**
   * Handles adding a new team to the database.
   */
  const handleAddTeam = async () => {
    if (!teamName.trim()) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        description,
        periodType,
        logoUrl,
        primaryColor,
        fouls,
        synced: 0,
      };
      await db.teams.add(newTeam);
      await syncService.pushUpdates();
      setOpen(false);
      setTeamName("");
      setDescription("");
      setPeriodType("QUARTERS");
      setLogoUrl("");
      setPrimaryColor("#154C56");
      setFouls(3);
      setShowValidation(false);
      setSnackbar({
        open: true,
        message: "Team created successfully!",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to add team", err, { teamName });
    } finally {
      setIsSubmitting(false);
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
        title="Teams"
        icon={<TeamsIcon />}
        subtitle="Manage your basketball teams"
        backTo="/"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Box sx={{ mt: 4 }}>
        {filteredTeams.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 12,
              bgcolor: "rgba(0,0,0,0.02)",
              borderRadius: 4,
              border: "2px dashed rgba(0,0,0,0.1)",
            }}
          >
            <TeamsIcon
              sx={{
                fontSize: 64,
                color: "text.secondary",
                opacity: 0.2,
                mb: 2,
              }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchTerm
                ? `No teams matching "${searchTerm}"`
                : "Your Notebook is Empty"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start by adding your first basketball team"}
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
                Create Team Now
              </Button>
            )}
          </Box>
        )}
        <Grid container spacing={3}>
          {filteredTeams.map((team) => {
            const aggregates = teamAggregatesMap[team.id!] || {
              record: "0-0",
              ppg: "0.0",
              rpg: "0.0",
              apg: "0.0",
              oppg: "0.0",
            };
            const contrastColor = getContrastColor(
              team.primaryColor || "#154C56",
            );

            return (
              <Grid item xs={12} sm={6} md={6} key={team.id}>
                <MoleskineCard
                  role="button"
                  tabIndex={0}
                  aria-label={`View stats for ${team.name}`}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    bgcolor: team.primaryColor || "primary.main",
                    color: contrastColor,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    },
                    "&:focus-visible": {
                      outline: `4px solid ${contrastColor === "white" ? "#fff" : "#000"}`,
                      outlineOffset: "2px",
                      transform: "translateY(-4px)",
                    },
                    display: "flex",
                    flexDirection: "column",
                    p: 0,
                    overflow: "hidden",
                    border: "none",
                  }}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/teams/${team.id}`);
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
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "var(--serif)",
                              fontWeight: 700,
                              mb: 0.5,
                              color: "inherit",
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
                              sx={{ color: "inherit", p: 0.5 }}
                              aria-label={
                                team.isFavorite
                                  ? `Remove ${team.name} from favorites`
                                  : `Mark ${team.name} as favorite`
                              }
                            >
                              {team.isFavorite ? (
                                <StarIcon sx={{ color: "#FFD700" }} />
                              ) : (
                                <StarBorderIcon sx={{ opacity: 0.5 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8, color: "inherit" }}
                        >
                          {team.description || "No description"}
                        </Typography>
                      </Box>
                      {team.logoUrl ? (
                        <Avatar
                          src={team.logoUrl}
                          variant="rounded"
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: "rgba(255,255,255,0.1)",
                            p: 0.5,
                          }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{
                            width: 60,
                            height: 60,
                            bgcolor: "rgba(255,255,255,0.2)",
                            color: "inherit",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                          }}
                        >
                          {getInitials(team.name)}
                        </Avatar>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: 800, color: "inherit" }}
                      >
                        {aggregates.record}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.7, color: "inherit" }}
                      >
                        WIN-LOSS RECORD
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "rgba(0,0,0,0.1)",
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <StatItem
                      label="PPG"
                      value={aggregates.ppg}
                      light={contrastColor === "white"}
                    />
                    <Typography
                      sx={{
                        color: contrastColor,
                        opacity: 0.3,
                        alignSelf: "center",
                      }}
                    >
                      |
                    </Typography>
                    <StatItem
                      label="RPG"
                      value={aggregates.rpg}
                      light={contrastColor === "white"}
                    />
                    <Typography
                      sx={{
                        color: contrastColor,
                        opacity: 0.3,
                        alignSelf: "center",
                      }}
                    >
                      |
                    </Typography>
                    <StatItem
                      label="APG"
                      value={aggregates.apg}
                      light={contrastColor === "white"}
                    />
                    <Typography
                      sx={{
                        color: contrastColor,
                        opacity: 0.3,
                        alignSelf: "center",
                      }}
                    >
                      |
                    </Typography>
                    <StatItem
                      label="OPPG"
                      value={aggregates.oppg}
                      light={contrastColor === "white"}
                    />
                  </Box>
                </MoleskineCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Tooltip title="Add New Team">
        <Fab
          color="primary"
          aria-label="add new team"
          sx={{
            position: "fixed",
            bottom: "calc(32px + env(safe-area-inset-bottom))",
            right: 32,
            transition: "transform 0.2s",
            "&:hover": { transform: "scale(1.1) rotate(90deg)" },
          }}
          onClick={() => {
            setOpen(true);
          }}
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
          Add New Team
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && teamName.trim()) {
                handleAddTeam();
              }
            }}
            sx={{ mt: 1, mb: 2 }}
            error={showValidation && !teamName.trim()}
            helperText={
              showValidation && !teamName.trim() ? "Team name is required" : ""
            }
            required
            disabled={isSubmitting}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && teamName.trim()) {
                handleAddTeam();
              }
            }}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
          <FormControl
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          >
            <InputLabel>Period Type</InputLabel>
            <Select
              value={periodType}
              onChange={(e) =>
                setPeriodType(e.target.value as "QUARTERS" | "HALVES")
              }
              label="Period Type"
            >
              <MenuItem value="QUARTERS">Quarters</MenuItem>
              <MenuItem value="HALVES">Halves</MenuItem>
            </Select>
            <FormHelperText>
              Determines if games are tracked by Quarters (4 periods) or Halves
              (2 periods).
            </FormHelperText>
          </FormControl>
          <TextField
            margin="dense"
            label="Logo URL (optional)"
            fullWidth
            variant="outlined"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && teamName.trim()) {
                handleAddTeam();
              }
            }}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
          <TextField
            margin="dense"
            label="Fouls"
            type="number"
            fullWidth
            variant="outlined"
            value={fouls}
            onChange={(e) => setFouls(parseInt(e.target.value) || 0)}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
            inputProps={{ min: 0 }}
            helperText="Default number of timeouts/fouls for this team"
          />
          <Typography
            variant="subtitle2"
            gutterBottom
            component="label"
            htmlFor="primary-color-input"
          >
            Primary Color
          </Typography>
          <input
            id="primary-color-input"
            type="color"
            style={{
              display: "block",
              width: "100%",
              height: 48,
              padding: "2px",
              border: "1px solid #D1D1D1",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor: "white",
            }}
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTeam}
            variant="contained"
            disabled={!teamName.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
