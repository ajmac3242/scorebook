import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Grid,
  Stack,
  List,
  Alert,
  AlertTitle,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { db, type Season, type Team } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { MoleskineCard, PageHeader } from "../components/SharedUI";
import { syncService } from "../utils/syncService";
import dayjs from "dayjs";
import {
  Delete,
  Restore,
  Warning,
  Edit as EditIcon,
} from "@mui/icons-material";
import EntityBanner from "../components/EntityBanner";

const SeasonDetail: React.FC = () => {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [primaryColor, setPrimaryColor] = useState("#154C56");
  const [timeLeft, setTimeLeft] = useState<string>("");

  const season = useLiveQuery(
    () => db.seasons.get(seasonId as string),
    [seasonId],
  );
  const teams =
    useLiveQuery(
      () =>
        db.teams
          .where("seasonId")
          .equals(seasonId || "")
          .toArray(),
      [seasonId],
    ) || [];

  useEffect(() => {
    if (season) {
      setName(season.name);
      setStartDate(season.startDate);
      setEndDate(season.endDate);
      setPeriodType(season.periodType || "QUARTERS");
      setPrimaryColor(season.primaryColor || "#154C56");
    }
  }, [season]);

  useEffect(() => {
    if (season?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(season.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [season?.deletedAt]);

  const handleUpdateSeason = async () => {
    if (!season) return;
    try {
      await db.seasons.update(season.id!, {
        name,
        startDate,
        endDate,
        periodType,
        primaryColor,
        synced: 0,
      });
      syncService.pushUpdates();
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Failed to update season:", err);
    }
  };

  const handleDeleteSeason = async () => {
    if (!season) return;
    try {
      const deletedAt = new Date().toISOString();
      await db.seasons.update(season.id!, { deletedAt, synced: 0 });
      // Also soft delete all teams and games in this season
      const seasonTeams = await db.teams
        .where("seasonId")
        .equals(season.id!)
        .toArray();
      for (const t of seasonTeams) {
        await db.teams.update(t.id!, { deletedAt, synced: 0 });
        const teamGames = await db.games
          .where("teamId")
          .equals(t.id!)
          .toArray();
        for (const g of teamGames) {
          await db.games.update(g.id!, { deletedAt, synced: 0 });
        }
      }
      syncService.pushUpdates();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete season:", err);
    }
  };

  const handleRestoreSeason = async () => {
    if (!season) return;
    try {
      await db.seasons.update(season.id!, { deletedAt: undefined, synced: 0 });
      // Restore associated teams and games if they were deleted at the same time or similar
      // For simplicity, we just clear deletedAt for all teams in this season
      const seasonTeams = await db.teams
        .where("seasonId")
        .equals(season.id!)
        .toArray();
      for (const t of seasonTeams) {
        await db.teams.update(t.id!, { deletedAt: undefined, synced: 0 });
        const teamGames = await db.games
          .where("teamId")
          .equals(t.id!)
          .toArray();
        for (const g of teamGames) {
          await db.games.update(g.id!, { deletedAt: undefined, synced: 0 });
        }
      }
      syncService.pushUpdates();
    } catch (err) {
      console.error("Failed to restore season:", err);
    }
  };

  if (!season) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  const isDeleted = !!season.deletedAt;

  return (
    <Box sx={{ p: 0, opacity: isDeleted ? 0.7 : 1 }}>
      <EntityBanner
        title={season.name}
        subtitle={`${dayjs(season.startDate).format("MMM YYYY")} - ${dayjs(season.endDate).format("MMM YYYY")}`}
        backTo="/seasons"
        primaryColor={primaryColor}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {!isDeleted ? (
              <>
                <IconButton
                  onClick={() => setEditDialogOpen(true)}
                  sx={{
                    color: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
              </>
            ) : (
              <Button
                startIcon={<Restore />}
                variant="contained"
                color="success"
                onClick={handleRestoreSeason}
              >
                Restore Season
              </Button>
            )}
          </Stack>
        }
      />

      <Box sx={{ p: { xs: 1, sm: 2 }, mt: 2 }}>
        {isDeleted && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 4 }}>
            <AlertTitle>Pending Deletion</AlertTitle>
            This season and all its data (teams, games, stats) are scheduled for
            permanent deletion in <strong>{timeLeft}</strong>. All data is
            currently read-only.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MoleskineCard sx={{ p: 2 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Season Rules
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Period Type
                  </Typography>
                  <Typography variant="body1">
                    {season.periodType || "QUARTERS"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Teams Tracked
                  </Typography>
                  <Typography variant="body1">
                    {teams.filter((t) => !t.deletedAt).length}
                  </Typography>
                </Box>
              </Stack>
            </MoleskineCard>
          </Grid>
          <Grid item xs={12} md={8}>
            <MoleskineCard sx={{ p: 2 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontFamily: "var(--serif)" }}
              >
                Teams in Season
              </Typography>
              <List sx={{ width: "100%" }}>
                {teams.filter((t) => !t.deletedAt).length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2 }}
                  >
                    No teams found.
                  </Typography>
                ) : (
                  teams
                    .filter((t) => !t.deletedAt)
                    .map((team) => (
                      <Box
                        key={team.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          border: "1px solid #eee",
                          borderRadius: 1,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#f5f5f5" },
                        }}
                        onClick={() => navigate(`/teams/${team.id}`)}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {team.name}
                        </Typography>
                      </Box>
                    ))
                )}
              </List>
            </MoleskineCard>
          </Grid>
        </Grid>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle
            sx={{
              fontFamily: "var(--serif)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Edit Season Details
            <IconButton
              color="error"
              onClick={() => {
                setEditDialogOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Delete />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Season Name"
              fullWidth
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
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
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleUpdateSeason}
              variant="contained"
              sx={{ ml: 1 }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
            Delete Season?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>{season.name}</strong>?
              This will mark the season and ALL associated teams, games, and
              stats as pending deletion. You will have 24 hours to restore it
              before it is permanently removed.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteSeason}
              color="error"
              variant="contained"
            >
              Yes, Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default SeasonDetail;
