import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { type Game, type Team } from "../../../db";
import EntityRowCard from "../../../components/cards/EntityRowCard";
import EmptyState from "../../../components/feedback/EmptyState";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import ActionBar from "../../../components/layout/ActionBar";
import { formatDisplayTime } from "../../../utils/datetime";
import { getInitials } from "../../../utils/stats";
import { useTokens } from "../../../theme/useTokens";

type ScheduleTabProps = {
  filteredSchedule: Game[];
  isDeleted: boolean;
  teamId: string | undefined;
  team: Team | undefined;
  onCreateGame: () => void;
  isMobile: boolean;
};

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  filteredSchedule,
  isDeleted,
  teamId,
  team,
  onCreateGame,
  isMobile,
}) => {
  const tokens = useTokens();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const defaultTeamAccent = tokens.semantic.color.brand.primary.main;

  const displaySchedule = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredSchedule;
    return filteredSchedule.filter((game) =>
      game.opponent.toLowerCase().includes(term),
    );
  }, [filteredSchedule, searchTerm]);

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: { xs: 2.5, md: 0 } }}>
        <ActionBar
          searchPlaceholder="Search opponent"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          actionLabel="Add game"
          actionAriaLabel="Add game"
          onActionClick={onCreateGame}
          actionIcon={<AddIcon />}
          actionDisabled={isDeleted}
        />

        {displaySchedule.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon sx={{ fontSize: 30 }} />}
            title={
              searchTerm
                ? `No games vs “${searchTerm}”`
                : "No games scheduled yet"
            }
            description={
              searchTerm
                ? "Try a different opponent name or clear the search."
                : "Create your first game to start tracking performance and results."
            }
            action={
              !isDeleted && !searchTerm ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateGame}
                  sx={{
                    borderRadius: `${tokens.semantic.component.radius.button}px`,
                    textTransform: "none",
                    fontWeight: tokens.typography.fontWeight.semibold,
                    boxShadow: "none",
                  }}
                >
                  Create first game
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {displaySchedule.map((game) => {
              const formattedTime = formatDisplayTime(game.time);
              return (
                <EntityRowCard
                  key={game.id}
                  accentColor={team?.primaryColor || defaultTeamAccent}
                  leading={
                    game.opponentLogoUrl ? (
                      <Box
                        component="img"
                        src={game.opponentLogoUrl}
                        alt={`${game.opponent} logo`}
                        sx={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          borderRadius: `${tokens.semantic.component.radius.button}px`,
                          bgcolor: tokens.semantic.color.background.paper,
                          border: "1px solid",
                          borderColor: tokens.semantic.color.border.subtle,
                          p: 0.5,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 44,
                          height: 44,
                          bgcolor: tokens.semantic.color.action.hover,
                          color: tokens.semantic.color.text.secondary,
                          fontWeight: tokens.typography.fontWeight.bold,
                        }}
                      >
                        {getInitials(game.opponent)}
                      </Avatar>
                    )
                  }
                  eyebrow={game.location || undefined}
                  title={`vs ${game.opponent}`}
                  subtitle={
                    game.completed
                      ? dayjs(game.date).format("MMM D, YYYY")
                      : `${dayjs(game.date).format("MMM D, YYYY")}${formattedTime ? ` • ${formattedTime}` : ""}`
                  }
                  badges={
                    game.completed ? (
                      <Chip
                        label="Final"
                        size="small"
                        sx={{
                          bgcolor: tokens.semantic.color.feedback.success.light,
                          color: tokens.semantic.color.feedback.success.main,
                          border: "none",
                          fontWeight: tokens.typography.fontWeight.semibold,
                          fontSize: tokens.typography.fontSize.xs,
                        }}
                      />
                    ) : null
                  }
                  trailing={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 0.75,
                        minWidth: 110,
                      }}
                    >
                      {game.completed ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: 0.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: tokens.typography.fontWeight.bold,
                                fontSize: tokens.typography.fontSize.lg,
                                fontVariantNumeric: "tabular-nums",
                                lineHeight: 1,
                                color: tokens.semantic.color.text.primary,
                              }}
                            >
                              {game.teamScore ?? "—"}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: tokens.typography.fontSize.sm,
                                color: tokens.semantic.color.text.muted,
                                lineHeight: 1,
                              }}
                            >
                              –
                            </Typography>
                            <Typography
                              sx={{
                                fontWeight: tokens.typography.fontWeight.bold,
                                fontSize: tokens.typography.fontSize.lg,
                                fontVariantNumeric: "tabular-nums",
                                lineHeight: 1,
                                color: tokens.semantic.color.text.primary,
                              }}
                            >
                              {game.oppScore ?? "—"}
                            </Typography>
                          </Box>
                          <Chip
                            label={
                              game.teamScore != null && game.oppScore != null
                                ? game.teamScore > game.oppScore
                                  ? "W"
                                  : game.teamScore < game.oppScore
                                    ? "L"
                                    : "D"
                                : "—"
                            }
                            size="small"
                            sx={{
                              fontWeight: tokens.typography.fontWeight.bold,
                              fontSize: tokens.typography.fontSize.xs,
                              border: "none",
                              bgcolor:
                                game.teamScore != null &&
                                game.teamScore > (game.oppScore ?? 0)
                                  ? tokens.semantic.color.feedback.success.light
                                  : game.teamScore != null &&
                                      game.teamScore < (game.oppScore ?? 999)
                                    ? tokens.semantic.color.feedback.error.light
                                    : tokens.semantic.color.surface.subtle,
                              color:
                                game.teamScore != null &&
                                game.teamScore > (game.oppScore ?? 0)
                                  ? tokens.semantic.color.feedback.success.main
                                  : game.teamScore != null &&
                                      game.teamScore < (game.oppScore ?? 999)
                                    ? tokens.semantic.color.feedback.error.main
                                    : tokens.semantic.color.text.muted,
                            }}
                          />
                        </>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={isDeleted}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/game?gameId=${game.id}&teamId=${teamId}`,
                            );
                          }}
                          sx={{
                            textTransform: "none",
                            borderRadius: `${tokens.semantic.component.radius.button}px`,
                            fontWeight: tokens.typography.fontWeight.bold,
                            boxShadow: "none",
                            px: 2,
                            minHeight: 36,
                          }}
                        >
                          Track
                        </Button>
                      )}
                    </Box>
                  }
                  onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                  ariaLabel={`Open game details for ${game.opponent}`}
                />
              );
            })}
          </Stack>
        )}
      </Box>

      {isMobile && (
        <Fab
          color="primary"
          aria-label="Create game"
          onClick={onCreateGame}
          disabled={isDeleted}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            boxShadow: tokens.semantic.elevation.shadow.card,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </PageSectionCard>
  );
};

export default ScheduleTab;
