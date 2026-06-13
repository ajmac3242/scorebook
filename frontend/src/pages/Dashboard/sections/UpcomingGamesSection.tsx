import React from "react";
import { Box, Typography, Stack, Button } from "@mui/material";
import { Event } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../../theme/useTokens";
import { formatDisplayTime } from "../../../utils/datetime";

interface UpcomingGamesSectionProps {
  upcomingGames: any[];
  favoriteTeamId: string;
  favoriteTeamName: string;
}

const UpcomingGamesSection: React.FC<UpcomingGamesSectionProps> = ({
  upcomingGames,
  favoriteTeamId,
  favoriteTeamName,
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
        <Event color="primary" />
        <Typography
          variant="h6"
          sx={{ fontWeight: tokens.semantic.typography.h6.fontWeight }}
        >
          Upcoming Games
        </Typography>
      </Box>
      {upcomingGames.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            py: "var(--cs-semantic-spacing-md)",
            textAlign: "center",
          }}
        >
          No upcoming games scheduled.
        </Typography>
      ) : (
        <Stack spacing="var(--cs-semantic-spacing-md)">
          {upcomingGames.map((game) => (
            <Box
              key={game.id}
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
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/game/stats?gameId=${game.id}`);
                }
              }}
              aria-label={`Upcoming game vs ${game.opponent} on ${dayjs(game.date).format("MMM D, YYYY")}`}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mb: "var(--cs-semantic-spacing-xs)",
                }}
              >
                {dayjs(game.date).format("MMM D, YYYY")}{" "}
                {formatDisplayTime(game.time)}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: tokens.semantic.typography.h6.fontWeight,
                }}
              >
                vs {game.opponent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {game.location}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
      <Button
        fullWidth
        variant="outlined"
        sx={{ mt: "var(--cs-semantic-spacing-lg)" }}
        onClick={() => navigate(`/teams/${favoriteTeamId}`)}
        aria-label={`View full schedule for ${favoriteTeamName}`}
      >
        View Full Schedule
      </Button>
    </PageSectionCard>
  );
};

export default UpcomingGamesSection;
