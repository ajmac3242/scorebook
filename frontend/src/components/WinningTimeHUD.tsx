import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Paper,
  Divider,
} from "@mui/material";
import {
  FlashOn,
  Shield,
  Timer,
  TrendingUp,
} from "@mui/icons-material";
import { WinningTimeRecommendation } from "../utils/stats/types";
import { pulse } from "../styles/animations";

interface WinningTimeHUDProps {
  recommendations: WinningTimeRecommendation;
}

export const WinningTimeHUD: React.FC<WinningTimeHUDProps> = ({
  recommendations,
}) => {
  return (
    <Paper
      elevation={6}
      sx={{
        p: 2,
        bgcolor: "#1a237e",
        color: "white",
        borderRadius: 2,
        border: "2px solid #ffd700",
        animation: `${pulse} 3s infinite ease-in-out`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -10,
          right: -10,
          opacity: 0.1,
          transform: "rotate(15deg)",
        }}
      >
        <FlashOn sx={{ fontSize: 80 }} />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ mb: 1.5, borderBottom: "1px solid rgba(255,255,255,0.2)", pb: 1 }}
      >
        <FlashOn sx={{ color: "#ffd700" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: 1 }}>
          WINNING TIME ADVISOR
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {/* Offensive Recommendation */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: "#4caf50" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8 }}>
              OFFENSIVE PATH
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            {recommendations.offensive.recommendation}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
            {recommendations.offensive.topSets.map((set, idx) => (
              <Chip
                key={idx}
                label={`${set.name}: ${set.ppp} PPP`}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

        {/* Defensive Recommendation */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Shield sx={{ fontSize: 16, color: "#f44336" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8 }}>
              DEFENSIVE PRIORITY
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            {recommendations.defensive.recommendation}
          </Typography>
          {recommendations.defensive.threats.length > 0 && (
            <Stack direction="row" spacing={1}>
              {recommendations.defensive.threats.map((threat, idx) => (
                <Tooltip key={idx} title={`${threat.points} points scored`}>
                  <Chip
                    label={`LOCK #${threat.jersey}`}
                    size="small"
                    color="error"
                    sx={{ fontSize: "0.6rem", fontWeight: 900 }}
                  />
                </Tooltip>
              ))}
            </Stack>
          )}
        </Box>

        <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />

        {/* Timeout Strategy */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: recommendations.timeout.strategy === "USE" ? "rgba(255, 152, 0, 0.2)" : "rgba(255,255,255,0.05)",
            borderRadius: 1,
            border: recommendations.timeout.strategy === "USE" ? "1px solid #ff9800" : "1px solid transparent",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Timer sx={{ fontSize: 16, color: recommendations.timeout.strategy === "USE" ? "#ff9800" : "white" }} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              TIMEOUT: {recommendations.timeout.strategy}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ display: "block", fontStyle: "italic" }}>
            {recommendations.timeout.reason}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};
