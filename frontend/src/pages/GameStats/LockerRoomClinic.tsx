import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Stack,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  School as ClinicIcon,
  CheckCircle as WinIcon,
  Error as ErrorIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { Game, StatEvent, db } from "../../db";
import { identifyCriticalMoments, CriticalMoment } from "../../utils/stats/clinic";
import { formatClock } from "../../utils/mathUtils";

interface LockerRoomClinicProps {
  game: Game;
  allStats: StatEvent[];
  teamPpp: string;
}

export const LockerRoomClinic: React.FC<LockerRoomClinicProps> = ({
  game,
  allStats,
  teamPpp,
}) => {
  const [reflections, setReflections] = useState(game.reflections || "");
  const [moments, setMoments] = useState<CriticalMoment[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMoments(identifyCriticalMoments(allStats, teamPpp));
  }, [allStats, teamPpp]);

  const handleSaveReflections = async () => {
    if (!game.id) return;
    setIsSaving(true);
    try {
      await db.games.update(game.id, { reflections });
    } catch (err) {
      console.error("Failed to save reflections:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper sx={{ p: 3, border: "2px solid", borderColor: "primary.main", borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <ClinicIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "var(--serif)" }}>
            LOCKER ROOM CLINIC
          </Typography>
        </Stack>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Critical Game Moments
        </Typography>

        <Stack spacing={2} sx={{ mb: 4 }}>
          {moments.map((m, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
              {m.type === "WIN" ? <WinIcon color="success" /> : <ErrorIcon color="error" />}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {m.type === "WIN" ? "Execution Win" : "Tactical Error"} - Period {m.period} ({formatClock(m.clockTime)})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.description}
                </Typography>
              </Box>
              <Tooltip title={m.type === "WIN" ? "High-efficiency execution (> 1.2 PPP)" : "Low-efficiency execution (< 0.8 PPP)"}>
                <Chip
                  label={`PPP: ${m.ppp}`}
                  size="small"
                  color={m.type === "WIN" ? "success" : "error"}
                  variant="outlined"
                />
              </Tooltip>
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Coach's Post-Game Reflection
        </Typography>
        <TextField
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          placeholder="What did we learn today? Key takeaways for next practice..."
          value={reflections}
          onChange={(e) => setReflections(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveReflections}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Reflections"}
        </Button>
      </Paper>
    </Box>
  );
};
