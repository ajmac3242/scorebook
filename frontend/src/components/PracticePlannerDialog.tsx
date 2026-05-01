import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  Chip,
} from "@mui/material";
import { TeamAggregates } from "../utils/stats";
import { Assignment as AssignmentIcon, FitnessCenter as DrillIcon } from "@mui/icons-material";

interface PracticePlannerDialogProps {
  open: boolean;
  onClose: () => void;
  teamStats: TeamAggregates;
}

const DRILL_LIBRARY: Record<string, { label: string; drills: string[] }> = {
  TO: {
    label: "Ball Security",
    drills: ["Gauntlet Passing Drill", "2-on-3 Pressure Break", "Baseline Trap Escape"],
  },
  FT: {
    label: "Free Throw Consistency",
    drills: ["100 Makes Challenge", "Fatigue FTs (Sprint between sets)", "High-Stakes FT Game"],
  },
  ORB: {
    label: "Offensive Rebounding",
    drills: ["3-Man Tip-In Drill", "Physicality Box-Out Sim", "Second-Chance Scoring Loop"],
  },
  EFG: {
    label: "Shot Selection & Finishing",
    drills: ["Corner 3 Progression", "Contact Layup Circuit", "Swing-Swing-Shoot Drill"],
  },
  AST: {
    label: "Floor Vision",
    drills: ["No-Dribble Scrimmage", "Fast Break 3-on-2 Flow", "Post-Entry Read Drill"],
  },
};

const PracticePlannerDialog: React.FC<PracticePlannerDialogProps> = ({
  open,
  onClose,
  teamStats,
}) => {
  const suggestions = useMemo(() => {
    const focusAreas = [];

    // Analyze turnovers (TO% > 15)
    if (parseFloat(teamStats.toPct || "0") > 15) {
      focusAreas.push({ key: "TO", value: teamStats.toPct, reason: "High turnover rate" });
    }

    // Analyze FT% (ftPct < 70)
    // TeamAggregates doesn't have ftPct directly, we'd calculate or use ftRate
    if (parseFloat(teamStats.ftRate || "0") < 20) {
      focusAreas.push({ key: "FT", value: teamStats.ftRate, reason: "Low free throw rate" });
    }

    // Analyze OREB% (orbPct < 25)
    if (parseFloat(teamStats.orbPct || "0") < 25) {
      focusAreas.push({ key: "ORB", value: teamStats.orbPct, reason: "Struggling on offensive glass" });
    }

    // Analyze eFG% (efgPct < 45)
    if (parseFloat(teamStats.efgPct || "0") < 45) {
      focusAreas.push({ key: "EFG", value: teamStats.efgPct, reason: "Poor effective shooting" });
    }

    // Sort by "worst" (simplistic) and take top 3
    return focusAreas.slice(0, 3);
  }, [teamStats]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontFamily: "var(--serif)" }}>
        <AssignmentIcon color="primary" /> DATA-DRIVEN PRACTICE PLANNER
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Based on the statistical performance of this game, we recommend focusing on these 3 areas in your next practice:
        </Typography>

        <Stack spacing={3} sx={{ mt: 3 }}>
          {suggestions.map((area) => {
            const library = DRILL_LIBRARY[area.key];
            return (
              <Box key={area.key}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {library.label}
                  </Typography>
                  <Chip
                    label={area.reason}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                  />
                </Box>
                <Stack spacing={1}>
                  {library.drills.map((drill) => (
                    <Box
                      key={drill}
                      sx={{
                        p: 1.5,
                        bgcolor: "rgba(0,0,0,0.02)",
                        borderRadius: 1,
                        border: "1px solid rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <DrillIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {drill}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            );
          })}

          {suggestions.length === 0 && (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4, fontWeight: 600 }}>
              Excellent game performance! Maintain current fundamentals in next practice.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button
          onClick={() => {
            // Mock export functionality
            alert("Practice plan copied to clipboard (Mock)");
            onClose();
          }}
          variant="contained"
        >
          Export Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PracticePlannerDialog;
