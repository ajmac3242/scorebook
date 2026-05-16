import React from "react";
import { Box, Typography, Grid, Tooltip, Stack } from "@mui/material";
import { FlashOn, LocalFireDepartment } from "@mui/icons-material";
import { MoleskineCard, AnimatedNumber } from "./SharedUI";
import { pulse } from "../styles/animations";

/**
 * 🏀 CoachBoard: Team Stats Card
 * Why: Centralizes team-level defensive metrics like Stops and Kills.
 */
export const TeamStatsCard = React.memo(
  ({
    defensiveStats,
    teamPpp,
    oppPpp,
    livePace,
    refTightness,
    activeSchemePpp,
  }: {
    defensiveStats: {
      totalStops: number;
      totalKills: number;
      currentStreak: number;
    };
    teamPpp: string;
    oppPpp: string;
    livePace: number;
    refTightness?: number;
    activeSchemePpp?: string;
  }) => {
    const getRefAdvice = (fpm: number) => {
      if (fpm > 0.8)
        return { text: "PLAY SOFT / AVOID REACHING", color: "error.main" };
      if (fpm < 0.4 && fpm > 0)
        return { text: "PRESS HARD / BE AGGRESSIVE", color: "success.main" };
      return { text: "STANDARD DEFENSIVE PRESSURE", color: "text.secondary" };
    };

    const advice = getRefAdvice(refTightness || 0);

    return (
      <MoleskineCard>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Team Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid  size={{ xs: 6 }}>
            <Tooltip title="Points Per Possession allowed in current defensive scheme">
              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  bgcolor: "secondary.dark",
                  color: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.5rem",
                    letterSpacing: 1,
                    mb: 0.5,
                    opacity: 0.9,
                  }}
                >
                  DEF SCHEME PPP
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {activeSchemePpp || "0.00"}
                </Typography>
              </Box>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "0.55rem",
                mt: 0.5,
                color: advice.color,
                lineHeight: 1.1,
              }}
            >
              {advice.text}
            </Typography>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Box
              sx={{
                textAlign: "center",
                p: 1.5,
                bgcolor: "rgba(0,0,0,0.03)",
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: 1,
                  mb: 0.5,
                }}
              >
                STOPS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                <AnimatedNumber value={defensiveStats.totalStops} />
              </Typography>
            </Box>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Box
              sx={{
                textAlign: "center",
                p: 1.5,
                bgcolor:
                  defensiveStats.currentStreak >= 2
                    ? "rgba(255,69,0,0.1)"
                    : "rgba(0,0,0,0.03)",
                borderRadius: 2,
                border:
                  defensiveStats.currentStreak >= 2
                    ? "1px solid #FF4500"
                    : "1px solid rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  KILLS
                </Typography>
                {defensiveStats.totalKills > 0 && (
                  <LocalFireDepartment
                    sx={{
                      fontSize: 14,
                      color: "#FF4500",
                      animation: `${pulse} 2s infinite`,
                    }}
                  />
                )}
              </Stack>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  color: "#FF4500",
                  lineHeight: 1,
                  textShadow: "0 2px 4px rgba(255,69,0,0.2)",
                  transform:
                    defensiveStats.currentStreak >= 2 ? "scale(1.1)" : "none",
                  transition: "transform 0.3s ease",
                }}
              >
                <AnimatedNumber value={defensiveStats.totalKills} />
              </Typography>
            </Box>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 700 }}
              >
                TEAM PPP
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {teamPpp}
              </Typography>
            </Box>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", fontWeight: 700 }}
              >
                OPP PPP
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {oppPpp}
              </Typography>
            </Box>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Tooltip title="Estimated possessions per 40 minutes (normalized speed of play)">
              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.5rem",
                    letterSpacing: 1,
                    mb: 0.5,
                    opacity: 0.9,
                  }}
                >
                  PACE
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {livePace.toFixed(1)}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid  size={{ xs: 6 }}>
            <Tooltip title="Fouls Per Minute (FPM). High values (>0.8) indicate a tightly called game.">
              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  bgcolor:
                    (refTightness || 0) > 0.8 ? "error.main" : "secondary.main",
                  color: "white",
                  borderRadius: 2,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.5rem",
                    letterSpacing: 1,
                    mb: 0.5,
                    opacity: 0.9,
                  }}
                >
                  REF TIGHTNESS
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {(refTightness || 0).toFixed(2)}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "text.secondary", mr: 1 }}
          >
            STREAK:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {[1, 2, 3].map((i) => (
              <FlashOn
                key={i}
                sx={{
                  fontSize: 22,
                  color:
                    i <= defensiveStats.currentStreak
                      ? "#FFD700"
                      : "rgba(0,0,0,0.1)",
                  filter:
                    i <= defensiveStats.currentStreak
                      ? "drop-shadow(0 0 4px #FFD700)"
                      : "none",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        </Box>
      </MoleskineCard>
    );
  },
);
