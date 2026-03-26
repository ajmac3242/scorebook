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
} from "@mui/material";
import { Add as AddIcon, Groups as TeamsIcon } from "@mui/icons-material";
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
  const [showValidation, setShowValidation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const allGamesQueryResult = useLiveQuery(
    async () =>
      teamIds.length > 0
        ? await db.games
            .where("teamId")
            .anyOf(teamIds as string[])
            .toArray()
        : [],
    [teamIds],
  );

  const allGames = useMemo(
    () => allGamesQueryResult || [],
    [allGamesQueryResult],
  );

  const gameIds = useMemo(
    () => allGames.map((g) => g.id).filter(Boolean),
    [allGames],
  );

  const allStatsQueryResult = useLiveQuery(
    async () =>
      gameIds.length > 0
        ? await db.stats
            .where("gameId")
            .anyOf(gameIds as string[])
            .toArray()
        : [],
    [gameIds],
  );

  const allStats = useMemo(
    () => allStatsQueryResult || [],
    [allStatsQueryResult],
  );

  // Pre-calculate team aggregates to avoid O(N^2) filtering in the render loop.
  const teamAggregatesMap = useMemo(() => {
    const gamesByTeam: Record<string, (typeof allGames)[0][]> = {};
    allGames.forEach((g) => {
      if (!gamesByTeam[g.teamId]) gamesByTeam[g.teamId] = [];
      gamesByTeam[g.teamId].push(g);
    });

    const statsByGame: Record<string, StatEvent[]> = {};
    allStats.forEach((s) => {
      if (!statsByGame[s.gameId]) statsByGame[s.gameId] = [];
      statsByGame[s.gameId].push(s as StatEvent);
    });

    const results: Record<
      string,
      ReturnType<typeof calculateTeamAggregates>
    > = {};
    teams.forEach((team) => {
      const teamGames = gamesByTeam[team.id!] || [];
      const teamStats = teamGames.flatMap((g) => statsByGame[g.id!] || []);
      results[team.id!] = calculateTeamAggregates(
        teamGames,
        teamStats as StatEvent[],
      );
    });
    return results;
  }, [teams, allGames, allStats]);

  /**
   * Handles adding a new team to the database.
   */
  const handleAddTeam = async () => {
    if (!teamName) {
      setShowValidation(true);
      return;
    }
    try {
      await db.open();
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        description,
        periodType,
        logoUrl,
        primaryColor,
        synced: 0,
      };
      await db.teams.add(newTeam);
      syncService.pushUpdates();
      setOpen(false);
      setTeamName("");
      setDescription("");
      setPeriodType("QUARTERS");
      setLogoUrl("");
      setPrimaryColor("#154C56");
      setShowValidation(false);
    } catch (err) {
      logger.error("Failed to add team", err, { teamName });
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
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
          <Typography
            color="text.secondary"
            sx={{ textAlign: "center", py: 8 }}
          >
            {searchTerm
              ? `No teams matching "${searchTerm}"`
              : "No teams found."}
          </Typography>
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
                    display: "flex",
                    flexDirection: "column",
                    p: 0,
                    overflow: "hidden",
                    border: "none",
                  }}
                  onClick={() => navigate(`/teams/${team.id}`)}
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
                            color: "inherit",
                          }}
                        >
                          {team.name}
                        </Typography>
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

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: "calc(32px + env(safe-area-inset-bottom))",
          right: 32,
        }}
        onClick={() => {
          setOpen(true);
        }}
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
            sx={{ mt: 1, mb: 2 }}
            error={showValidation && !teamName}
            helperText={
              showValidation && !teamName ? "Team name is required" : ""
            }
            required
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
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
          </FormControl>
          <TextField
            margin="dense"
            label="Logo URL (optional)"
            fullWidth
            variant="outlined"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Primary Color
          </Typography>
          <input
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
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTeam}
            variant="contained"
            disabled={!teamName}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
