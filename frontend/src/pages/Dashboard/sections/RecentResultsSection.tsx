import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { Assessment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../../theme/useTokens";
import { Game } from "../../../db";

interface RecentResultsSectionProps {
  recentResults: (Game & {
    teamScore: number;
    oppScore: number;
    result: string;
  })[];
}

const RecentResultsSection: React.FC<RecentResultsSectionProps> = ({
  recentResults,
}) => {
  const navigate = useNavigate();
  const tokens = useTokens();

  return (
    <PageSectionCard>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: "var(--cs-semantic-spacing-md)",
          gap: "var(--cs-semantic-spacing-xs)",
        }}
      >
        <Assessment color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
        >
          Recent Results
        </Typography>
      </Box>
      {recentResults.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            py: "var(--cs-semantic-spacing-md)",
            textAlign: "center",
          }}
        >
          No games completed yet.
        </Typography>
      ) : (
        <Stack spacing="var(--cs-semantic-spacing-md)">
          {recentResults.map((game) => (
            <Box
              key={game.id}
              role="button"
              tabIndex={0}
              aria-label={`View stats for game vs ${game.opponent}`}
              sx={{
                p: "var(--cs-semantic-spacing-md)",
                borderRadius: "var(--cs-semantic-shape-radius-md)",
                bgcolor: "var(--cs-semantic-color-action-hover)",
                border: `1px solid var(--cs-semantic-color-border-subtle)`,
                cursor: "pointer",
                transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
                "&:hover": {
                  bgcolor: "var(--cs-semantic-color-action-selected)",
                  transform: "translateY(-4px)",
                  boxShadow: "var(--cs-elevation-shadow-card)",
                },
              }}
              onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/game/stats?gameId=${game.id}`);
                }
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: "var(--cs-semantic-spacing-xs)",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {dayjs(game.date).format("MMM D")}
                </Typography>
                <Chip
                  label={game.result}
                  size="small"
                  color={
                    game.result === "W"
                      ? "success"
                      : game.result === "L"
                        ? "error"
                        : "default"
                  }
                  sx={{
                    height: 16,
                    fontSize: "var(--cs-typography-fontSize-xs)",
                    fontWeight: 900,
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  vs {game.opponent}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {game.teamScore} - {game.oppScore}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </PageSectionCard>
  );
};

export default RecentResultsSection;
