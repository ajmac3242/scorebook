import React, { useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Typography,
  Fab,
  Stack,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, CalendarToday as CalendarIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { type Game, type Team } from "../../../db";
import { getInitials } from "../../../utils/stats";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import EntityRowCard from "../../../components/cards/EntityRowCard";
import EmptyState from "../../../components/feedback/EmptyState";

type ScheduleTabProps = {
  filteredSchedule: Game[];
  scheduleView: "upcoming" | "all";
  setScheduleView: (_v: "upcoming" | "all") => void;
  isDeleted: boolean;
  teamId: string | undefined;
  team: Team | undefined;
  controlRadius: number;
  onCreateGame: () => void;
  isMobile: boolean;
};

const DEFAULT_TEAM_ACCENT = "var(--cs-semantic-color-brand-primary-main)";

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  filteredSchedule,
  scheduleView,
  setScheduleView,
  isDeleted,
  teamId,
  team,
  controlRadius,
  onCreateGame,
  isMobile,
}) => {
  const navigate = useNavigate();
  const sectionPadding = { xs: 2.5, md: 0 };

  // Auto-switch to "all" when there are no upcoming games so user doesn't land on a blank view
  useEffect(() => {
    if (scheduleView === "upcoming" && filteredSchedule.length === 0) {
      setScheduleView("all");
    }
  }, [filteredSchedule.length, scheduleView, setScheduleView]);

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Stack
          direction="row"
          sx={{
            mb: 2,
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tabs
            value={scheduleView}
            onChange={(_, val) => val && setScheduleView(val)}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 40,
                fontSize: "var(--cs-typography-fontSize-sm)",
                px: 1.5,
              },
            }}
          >
            <Tab value="upcoming" label="Upcoming" />
            <Tab value="all" label="All" />
          </Tabs>

          <Box sx={{ display: { xs: "none", sm: "flex" } }}>
            <Tooltip title={isDeleted ? "" : "Add game"} placement="left">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onCreateGame}
                  disabled={isDeleted}
                  startIcon={<AddIcon />}
                  aria-label="Add game"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: `${controlRadius}px`,
                    boxShadow: "none",
                    px: 2,
                    minHeight: 36,
                    "&.Mui-disabled": { opacity: 0.4 },
                  }}
                >
                  Add game
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Stack>

        {filteredSchedule.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon sx={{ fontSize: 30 }} />}
            title={
              scheduleView === "upcoming"
                ? "No upcoming games"
                : "No games scheduled yet"
            }
            description={
              scheduleView === "upcoming"
                ? "Switch to all games or create a new matchup for this team."
                : "Create your first game to start tracking performance and results."
            }
            action={
              !isDeleted ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateGame}
                  sx={{
                    borderRadius: `${controlRadius}px`,
                    textTransform: "none",
                    fontWeight: 600,
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
            {filteredSchedule.map((game) => (
              <EntityRowCard
                key={game.id}
                accentColor={team?.primaryColor || DEFAULT_TEAM_ACCENT}
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
                        borderRadius: `${controlRadius}px`,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                        p: 0.5,
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: "action.hover",
                        color: "text.secondary",
                        fontWeight: 700,
                      }}
                    >
                      {getInitials(game.opponent)}
                    </Avatar>
                  )
                }
                eyebrow={
                  <>
                    {game.completed
                      ? dayjs(game.date).format("MMM D, YYYY")
                      : null}
                    {game.completed && game.location ? ` • ${game.location}` : null}
                    {!game.completed && game.location ? game.location : null}
                  </>
                }
                title={`vs ${game.opponent}`}
                badges={
                  game.completed ? (
                    <Chip
                      label="Final"
                      size="small"
                      sx={{
                        bgcolor: "var(--cs-semantic-color-success-subtle)",
                        color: "var(--cs-semantic-color-success-text)",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "var(--cs-typography-fontSize-xs)",
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
                      gap: 0.5,
                      minWidth: 110,
                    }}
                  >
                    {game.completed ? (
                      <>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "var(--cs-typography-fontSize-lg)",
                              fontVariantNumeric: "tabular-nums",
                              lineHeight: 1,
                              color: "var(--cs-semantic-color-text-primary)",
                            }}
                          >
                            {game.teamScore ?? "—"}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: "var(--cs-typography-fontSize-sm)",
                              color: "var(--cs-semantic-color-text-muted)",
                              lineHeight: 1,
                            }}
                          >
                            –
                          </Typography>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "var(--cs-typography-fontSize-lg)",
                              fontVariantNumeric: "tabular-nums",
                              lineHeight: 1,
                              color: "var(--cs-semantic-color-text-primary)",
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
                            fontWeight: 700,
                            fontSize: "var(--cs-typography-fontSize-xs)",
                            border: "none",
                            bgcolor:
                              game.teamScore != null && game.teamScore > (game.oppScore ?? 0)
                                ? "var(--cs-semantic-color-success-subtle)"
                                : game.teamScore != null && game.teamScore < (game.oppScore ?? 999)
                                ? "var(--cs-semantic-color-error-subtle)"
                                : "var(--cs-semantic-color-surface-offset)",
                            color:
                              game.teamScore != null && game.teamScore > (game.oppScore ?? 0)
                                ? "var(--cs-semantic-color-success-text)"
                                : game.teamScore != null && game.teamScore < (game.oppScore ?? 999)
                                ? "var(--cs-semantic-color-error-text)"
                                : "var(--cs-semantic-color-text-muted)",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "var(--cs-typography-fontSize-base)",
                            color: "var(--cs-semantic-color-text-primary)",
                            lineHeight: 1.2,
                          }}
                        >
                          {dayjs(game.date).format("MMM D")}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "var(--cs-typography-fontSize-sm)",
                            color: "var(--cs-semantic-color-text-muted)",
                          }}
                        >
                          {game.time ?? "TBD"}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={isDeleted}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/game?gameId=${game.id}&teamId=${teamId}`);
                          }}
                          sx={{
                            textTransform: "none",
                            borderRadius: `${controlRadius}px`,
                            fontWeight: 600,
                            boxShadow: "none",
                            mt: 0.5,
                          }}
                        >
                          Track
                        </Button>
                      </>
                    )}
                  </Box>
                }
                onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                ariaLabel={`Open game details for ${game.opponent}`}
              />
            ))}
          </Stack>
        )}
      </Box>
      {/* Mobile FAB */}
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
            boxShadow: "var(--cs-shadow-lg)",
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </PageSectionCard>
  );
};

export default ScheduleTab;
