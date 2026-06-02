import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Assessment as ChartIcon } from "@mui/icons-material";
import { PlayEfficiency } from "../../utils/stats";
import BasketballCourt from "./BasketballCourt";
import { StatEvent } from "../../db";
import { MoleskineCard } from "../SharedUI";

interface PlaybookEfficiencyWidgetProps {
  plays: PlayEfficiency[];
  teamPpp: number;
  gameStats: StatEvent[];
}

const PlaybookEfficiencyWidget: React.FC<PlaybookEfficiencyWidgetProps> = ({
  plays,
  teamPpp,
  gameStats,
}) => {
  const [selectedPlay, setSelectedPlay] = useState<string | null>(null);

  const getEfficiencyColor = (ppp: string) => {
    const val = parseFloat(ppp);
    if (val > teamPpp * 1.1) return "success.main";
    if (val < teamPpp * 0.9) return "error.main";
    return "warning.main";
  };

  const filteredMarkers = gameStats
    .filter(
      (s) =>
        s.playName === selectedPlay && (s.type === "MAKE" || s.type === "MISS"),
    )
    .map((s) => ({
      id: s.id,
      x: s.locationX || 0,
      y: s.locationY || 0,
      type: s.type as "MAKE" | "MISS",
    }));

  return (
    <MoleskineCard>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Playbook Efficiency
      </Typography>
      <Stack spacing={1}>
        {plays.slice(0, 3).map((play) => (
          <Box
            key={play.name}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              bgcolor: "rgba(0,0,0,0.02)",
              borderRadius: 1,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, display: "block" }}
              >
                {play.name.toUpperCase()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: getEfficiencyColor(play.ppp) }}
              >
                {play.ppp} PPP{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({play.attempts} poss)
                </Typography>
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setSelectedPlay(play.name)}>
              <ChartIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        {plays.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", py: 1 }}
          >
            No plays tagged yet.
          </Typography>
        )}
      </Stack>

      <Dialog
        open={!!selectedPlay}
        onClose={() => setSelectedPlay(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Shot Chart: {selectedPlay}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <BasketballCourt markers={filteredMarkers} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPlay(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </MoleskineCard>
  );
};

export default PlaybookEfficiencyWidget;
