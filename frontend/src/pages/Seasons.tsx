import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
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
  Stack,
  Divider,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { db, type Season, type Game } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { LocalizationProvider, StaticDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";

const Seasons: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const allGames = useLiveQuery(() => db.games.toArray()) || [];

  const handleAddSeason = async () => {
    const newSeason: Season = {
      name,
      startDate,
      endDate,
      synced: 0,
    };
    try {
      await db.open();
      await db.seasons.add(newSeason);
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("Failed to add season:", err);
    }
  };

  const gamesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.format("YYYY-MM-DD");
    return allGames.filter((g) => g.date === dateStr);
  }, [allGames, selectedDate]);

  const activeSeasonForDate = useMemo(() => {
    if (!selectedDate) return null;
    return seasons.find((s) => {
      const start = dayjs(s.startDate);
      const end = dayjs(s.endDate);
      return (
        (selectedDate.isAfter(start) || selectedDate.isSame(start, "day")) &&
        (selectedDate.isBefore(end) || selectedDate.isSame(end, "day"))
      );
    });
  }, [seasons, selectedDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h4"
          sx={{ fontFamily: "var(--serif)", mb: 4, textAlign: "center" }}
        >
          Seasons & Events
        </Typography>

        <Grid container spacing={4}>
          {/* Left Side: Calendar View */}
          <Grid item xs={12} md={6}>
            <Paper className="moleskine-card" sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
                Planner
              </Typography>
              <Box sx={{ border: "1px solid #D1D1D1", borderRadius: 1 }}>
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
                    "& .MuiPickersDay-root.Mui-selected": {
                      bgcolor: "var(--moleskine-charcoal)",
                      color: "var(--moleskine-ivory)",
                    },
                    "& .MuiPickersDay-today": {
                      borderColor: "var(--moleskine-charcoal)",
                    },
                  }}
                />
              </Box>
              {activeSeasonForDate ? (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Active Season
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {activeSeasonForDate.name}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No active season for this date.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Side: Agenda View */}
          <Grid item xs={12} md={6}>
            <Paper className="moleskine-card" sx={{ p: 3, height: "100%", minHeight: 400 }}>
              <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 1 }}>
                Agenda
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
                        borderLeft: "4px solid var(--moleskine-charcoal)",
                        mb: 2,
                        bgcolor: "rgba(0,0,0,0.02)",
                        borderRadius: "0 4px 4px 0",
                      }}
                      secondaryAction={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/game?gameId=${game.id}&teamId=${game.teamId}`)}
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

              <Box sx={{ mt: "auto", pt: 4 }}>
                <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
                  All Seasons
                </Typography>
                <Stack spacing={1}>
                  {seasons.map((s) => (
                    <Box
                      key={s.id}
                      onClick={() => setSelectedDate(dayjs(s.startDate))}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderBottom: "1px dashed #D1D1D1",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {s.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(s.startDate).format("MMM YYYY")} - {dayjs(s.endDate).format("MMM YYYY")}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: "fixed", bottom: 32, right: 32, bgcolor: "var(--moleskine-charcoal)" }}
          onClick={() => setOpen(true)}
        >
          <AddIcon />
        </Fab>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle sx={{ fontFamily: "var(--serif)" }}>New Season</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Season Name"
              type="text"
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
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
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
