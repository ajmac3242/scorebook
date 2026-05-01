import React, { useMemo } from "react";
import { Box, Typography, Chip, Stack, useTheme, Divider } from "@mui/material";
import { FlashOn, Star as StarIcon } from "@mui/icons-material";
import { MoleskineCard } from "../SharedUI";
import { ClutchPlay, MatchupStats } from "../../utils/stats/types";
import { calculateClutchPlaybookRanking } from "../../utils/stats";
import { StatEvent } from "../../db";


interface ClutchMatchup extends MatchupStats {
  pppDelta: number;
  playerNumber: string;
  opponentNumber: string;
}
export interface ClutchPlaybookAdvisorProps {
  playbook: string[];
  allStats: StatEvent[];
  matchups: MatchupStats[];
  isClutch: boolean;
}

export const ClutchPlaybookAdvisor: React.FC<ClutchPlaybookAdvisorProps> = ({
  allStats,
  matchups,
  isClutch,
}) => {
  const theme = useTheme();

  const rankings = useMemo(() => {
    return calculateClutchPlaybookRanking(
      allStats,
      240,
      matchups,
        );
  }, [allStats, matchups]);

  if (!isClutch || rankings.length === 0) return null;

  return (
    <MoleskineCard
      sx={{
        borderLeft: "4px solid",
        borderLeftColor: "warning.main",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(90deg, rgba(255,193,7,0.05) 0%, rgba(0,0,0,0) 100%)"
            : "linear-gradient(90deg, rgba(255,193,7,0.02) 0%, rgba(0,0,0,0) 100%)",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 800,
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <FlashOn fontSize="small" color="warning" />
          CLUTCH PLAYBOOK
        </Typography>
        <Chip
          label="WINNING TIME"
          size="small"
          color="warning"
          sx={{ fontWeight: 900, fontSize: "0.6rem", borderRadius: "4px" }}
        />
      </Stack>

      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "text.secondary",
            mb: 1,
            display: "block",
          }}
        >
          TOP EFFICIENCY PLAYS:
        </Typography>
        <Stack spacing={1}>
          {rankings.slice(0, 3).map((play: ClutchPlay, idx: number) => (
            <Box
              key={play.playName}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1,
                borderRadius: "8px",
                bgcolor: idx === 0 ? "rgba(255, 193, 7, 0.1)" : "transparent",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: idx === 0 ? 800 : 600 }}
              >
                {play.playName}
              </Typography>
              <Typography
                variant="body2"
                color="warning.main"
                sx={{ fontWeight: 900 }}
              >
                {typeof play.ppp === "number" ? play.ppp.toFixed(2) : play.ppp}{" "}
                PPP
              </Typography>
            </Box>
          ))}
        </Stack>

        {(matchups as ClutchMatchup[]).filter(
          (m: ClutchMatchup) => m.pppDelta > 0.3,
        ).length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                mb: 1,
                display: "block",
              }}
            >
              EXTRACT MISMATCHES:
            </Typography>
            <Stack spacing={1}>
              {(matchups as ClutchMatchup[])
                .filter((m: ClutchMatchup) => m.pppDelta > 0.3)
                .slice(0, 2)
                .map((m: ClutchMatchup) => (
                  <Box
                    key={m.playerId}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <StarIcon sx={{ fontSize: 14, color: "warning.main" }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      #{m.playerNumber} is +{m.pppDelta} PPP vs{" "}
                      {m.opponentNumber}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          </>
        )}
      </Box>
    </MoleskineCard>
  );
};
