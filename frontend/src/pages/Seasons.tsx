import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Grid,
  Divider,
  MenuItem,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Settings,
  EventNote as SeasonsIcon,
  SportsBasketball as BasketballIcon,
} from "@mui/icons-material";
import { db, type Season } from "../db";
import { syncService } from "../utils/syncService";
import { useLiveQuery } from "dexie-react-hooks";
import { LocalizationProvider, StaticDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { MoleskineCard, StatItem } from "../components/SharedUI";
import EntityBanner from "../components/EntityBanner";

const Seasons: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [primaryColor, setPrimaryColor] = useState("#154C56");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [searchTerm, setSearchTerm] = useState("");

  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const allTeams = useLiveQuery(() => db.teams.toArray()) || [];
  const allGames = useLiveQuery(() => db.games.toArray()) || [];

  const seasonsWithStats = useMemo(() => {
    return seasons
      .filter((s) => !s.deletedAt)
      .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((s) => {
        const teamCount = allTeams.filter((t) => t.seasonId === s.id).length;
        const gameCount = allGames.filter(
          (g) =>
            g.teamId &&
            allTeams.find((t) => t.id === g.teamId && t.seasonId === s.id),
        ).length;
        return { ...s, teamCount, gameCount };
      });
  }, [seasons, allTeams, allGames, searchTerm]);

  const handleAddSeason = async () => {
    try {
      await db.open();
      await db.seasons.add({
        id: crypto.randomUUID(),
        name,
        startDate,
        endDate,
        periodType,
        primaryColor,
        synced: 0,
      });
      syncService.pushUpdates();
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setPeriodType("QUARTERS");
      setPrimaryColor("#154C56");
    } catch (err) {
      console.error("Failed to add season:", err);
    }
  };

  const gamesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return allGames.filter((g) => g.date === dateStr && !g.deletedAt);
  }, [allGames, selectedDate]);

  const activeSeasonForDate = useMemo(() => {
    if (!selectedDate) return null;
    return seasons.find((s) => {
      if (s.deletedAt) return false;
      const start = dayjs(s.startDate),
        end = dayjs(s.endDate);
      return (
        (selectedDate.isAfter(start) || selectedDate.isSame(start, "day")) &&
        (selectedDate.isBefore(end) || selectedDate.isSame(end, "day"))
      );
    });
  }, [seasons, selectedDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ pb: 8 }}>
        <EntityBanner title="Seasons" icon={<SeasonsIcon />} backTo="/" />

        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Filter seasons by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 4, bgcolor: "white", borderRadius: 1 }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {seasonsWithStats.map((season) => (
            <Grid item xs={12} sm={6} md={4} key={season.id}>
              <MoleskineCard
                sx={{
                  cursor: "pointer",
                  height: "100%",
                  bgcolor: season.primaryColor || "primary.main",
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
                }}
                onClick={() => navigate(`/seasons/${season.id}`)}
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
                        {season.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.8, color: "white" }}
                      >
                        {dayjs(season.startDate).format("MMM YYYY")} -{" "}
                        {dayjs(season.endDate).format("MMM YYYY")}
                      </Typography>
                    </Box>
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                      }}
                    >
                      <BasketballIcon sx={{ fontSize: "2rem" }} />
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
                  <StatItem label="TEAMS" value={season.teamCount} light />
                  <StatItem label="GAMES" value={season.gameCount} light />
                </Box>
              </MoleskineCard>
            </Grid>
          ))}
          {seasonsWithStats.length === 0 && (
            <Grid item xs={12}>
              <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 8 }}
              >
                {searchTerm
                  ? `No seasons matching "${searchTerm}"`
                  : "No seasons found."}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 6 }} />

        <Grid container spacing={4} sx={{ pb: 10 }}>
          <Grid item xs={12} md={6}>
            <MoleskineCard sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", mb: 2 }}
              >
                Planner
              </Typography>
              <Box
                sx={{
                  border: "1px solid #D1D1D1",
                  borderRadius: 1,
                  overflow: "hidden",
                  "& .MuiPickersLayout-root": {
                    minWidth: "unset",
                  },
                }}
              >
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  slotProps={{
                    actionBar: { sx: { display: "none" } },
                    toolbar: { hidden: true },
                  }}
                  sx={{
                    bgcolor: "transparent",
                    "& .MuiDateCalendar-root": {
                      width: "100%",
                      height: "auto",
                    },
                    "& .MuiDayCalendar-header": {
                      justifyContent: "space-around",
                    },
                    "& .MuiDayCalendar-weekContainer": {
                      justifyContent: "space-around",
                    },
                  }}
                />
              </Box>
              {activeSeasonForDate ? (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "#f9f9f9",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Active Season
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {activeSeasonForDate.name}
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<Settings />}
                    onClick={() =>
                      navigate(`/seasons/${activeSeasonForDate.id}`)
                    }
                  >
                    Manage
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No active season for this date.
                  </Typography>
                </Box>
              )}
            </MoleskineCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <MoleskineCard sx={{ p: 3, height: "100%", minHeight: 400 }}>
              <Typography
                variant="h6"
                sx={{ fontFamily: "var(--serif)", mb: 1 }}
              >
                Agenda
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {selectedDate?.format("MMMM D, YYYY")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {gamesForSelectedDate.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No games scheduled for this day.
                    </Typography>
                  </Box>
                ) : (
                  gamesForSelectedDate.map((game) => (
                    <ListItem
                      key={game.id}
                      sx={{
                        borderLeft: "4px solid var(--palette-deep-ocean)",
                        mb: 2,
                        bgcolor: "rgba(0,0,0,0.02)",
                        borderRadius: "0 4px 4px 0",
                      }}
                      secondaryAction={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            navigate(
                              `/game?gameId=${game.id}&teamId=${game.teamId}`,
                            )
                          }
                        >
                          Start
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`vs ${game.opponent}`}
                        secondary={game.location}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </MoleskineCard>
          </Grid>
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
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>New Season</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Season Name"
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Period Type"
              fullWidth
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="QUARTERS">Quarters (1-4)</MenuItem>
              <MenuItem value="HALVES">Halves (1-2)</MenuItem>
            </TextField>
            <Typography variant="subtitle2" gutterBottom>
              Banner Color
            </Typography>
            <input
              type="color"
              style={{
                display: "block",
                width: "100%",
                height: 40,
                border: "1px solid #D1D1D1",
                borderRadius: 4,
              }}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSeason} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Seasons;
