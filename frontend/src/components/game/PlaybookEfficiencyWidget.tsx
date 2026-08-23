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
  Tooltip,
} from "@mui/material";
import { Assessment as ChartIcon, AutoGraph } from "@mui/icons-material";
import { PlayEfficiency } from "../../utils/stats";
import BasketballCourt from "./BasketballCourt";
import { StatEvent } from "../../db";
import { SurfaceCard } from "../cards/SurfaceCard";
import { useTokens } from "../../theme/useTokens";
import { EmptyState } from "../feedback";

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
  const tokens = useTokens();
  const [selectedPlay, setSelectedPlay] = useState<string | null>(null);

  const getEfficiencyColor = (ppp: string) => {
    const val = parseFloat(ppp);
    if (val > teamPpp * 1.1) return tokens.semantic.color.feedback.success.main;
    if (val < teamPpp * 0.9) return tokens.semantic.color.feedback.error.main;
    return tokens.semantic.color.feedback.warning.main;
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
    <SurfaceCard>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: tokens.typography.fontWeight.bold,
          mb: tokens.semantic.spacing.xs,
        }}
      >
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
              p: tokens.semantic.spacing.xs,
              bgcolor: tokens.semantic.color.action.hover,
              borderRadius: `${tokens.semantic.shape.radius.xs}px`,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  display: "block",
                }}
              >
                {play.name.toUpperCase()}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: tokens.typography.fontWeight.black,
                  color: getEfficiencyColor(play.ppp),
                }}
              >
                {play.ppp} PPP{" "}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: tokens.semantic.color.text.secondary }}
                >
                  ({play.attempts} poss)
                </Typography>
              </Typography>
            </Box>
            <Tooltip title={`View shot chart for ${play.name}`}>
              <IconButton
                size="small"
                onClick={() => setSelectedPlay(play.name)}
                aria-label={`view shot chart for ${play.name}`}
              >
                <ChartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
        {plays.length === 0 && (
          <EmptyState
            icon={
              <AutoGraph
                sx={{ fontSize: tokens.semantic.component.iconSize.md }}
              />
            }
            title="No plays tagged yet"
            description="Tag possessions with play names to see their efficiency here."
          />
        )}
      </Stack>

      <Dialog
        open={!!selectedPlay}
        onClose={() => setSelectedPlay(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="playbook-shot-chart-title"
      >
        <DialogTitle
          id="playbook-shot-chart-title"
          sx={{
            fontFamily: tokens.typography.fontFamily.display,
            fontWeight: tokens.typography.fontWeight.bold,
          }}
        >
          Shot Chart: {selectedPlay}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: tokens.semantic.spacing.xs }}>
            <BasketballCourt markers={filteredMarkers} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPlay(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </SurfaceCard>
  );
};

export default PlaybookEfficiencyWidget;
