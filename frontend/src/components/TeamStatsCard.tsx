import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import { FlashOn } from "@mui/icons-material";
import { MoleskineCard, AnimatedNumber } from "./SharedUI";

/**
 * 🏀 CoachBoard: Team Stats Card
 * Why: Centralizes team-level defensive metrics like Stops and Kills.
 */
export const TeamStatsCard = React.memo(
  ({
    defensiveStats,
    teamPpp,
    oppPpp,
  }: {
    defensiveStats: {
      totalStops: number;
      totalKills: number;
      currentStreak: number;
    };
    teamPpp: string;
    oppPpp: string;
  }) => {
    return (
      <MoleskineCard>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Team Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
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
          <Grid item xs={6}>
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
                KILLS
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#FF4500",
                  lineHeight: 1,
                  textShadow: "0 2px 4px rgba(255,69,0,0.2)",
                }}
              >
                <AnimatedNumber value={defensiveStats.totalKills} />
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
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
          <Grid item xs={6}>
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
