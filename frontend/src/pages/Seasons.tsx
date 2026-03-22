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
  Stack,
  Divider,
  MenuItem,
} from "@mui/material";
import { Add as AddIcon, Settings } from "@mui/icons-material";
import { db, type Season } from "../db";
import { syncService } from "../utils/syncService";
import { useLiveQuery } from "dexie-react-hooks";
import { LocalizationProvider, StaticDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import { MoleskineCard, PageHeader } from "../components/SharedUI";

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

  const seasons = useLiveQuery(() => db.seasons.toArray()) || [];
  const allGames = useLiveQuery(() => db.games.toArray()) || [];

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
      <Box sx={{ p: 2 }}>
        <PageHeader title="Seasons & Events" />
        <Grid container spacing={4}>
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
              <Box sx={{ mt: "auto", pt: 4 }}>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: "var(--serif)", mb: 2 }}
                >
                  All Seasons
                </Typography>
                <Stack spacing={1}>
                  {seasons.map((s) => (
                    <Box
                      key={s.id}
                      onClick={() => navigate(`/seasons/${s.id}`)}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderBottom: "1px dashed #D1D1D1",
                        cursor: "pointer",
                        opacity: s.deletedAt ? 0.5 : 1,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {s.name} {s.deletedAt && "(Pending Delete)"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(s.startDate).format("MMM YYYY")} -{" "}
                          {dayjs(s.endDate).format("MMM YYYY")}
                        </Typography>
                      </Box>
                      <Button size="small">Details</Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </MoleskineCard>
          </Grid>
        </Grid>
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 32,
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
