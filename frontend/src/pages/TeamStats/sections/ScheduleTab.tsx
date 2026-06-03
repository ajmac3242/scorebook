import React, { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Fab,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { type Game, type Team } from "../../../db";
import EntityRowCard from "../../../components/cards/EntityRowCard";
import EmptyState from "../../../components/feedback/EmptyState";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { formatDisplayTime } from "../../../utils/datetime";
import { getInitials } from "../../../utils/stats";

type ScheduleTabProps = {
  filteredSchedule: Game[];
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
  isDeleted,
  teamId,
  team,
  controlRadius,
  onCreateGame,
  isMobile,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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
        <Stack
          direction="row"
          sx={{
            mb: 2,
            gap: 1.5,
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search opponent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: `${controlRadius}px`,
                fontSize: "var(--cs-typography-fontSize-sm)",
                bgcolor: "var(--cs-semantic-color-surface-subtle)",
              },
            }}
            slotProps={{
          input: {{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: 18,
                      color: "var(--cs-semantic-color-text-muted)",
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear">
                    <Box
                      component="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 0.25,
                        border: "none",
                        bgcolor: "transparent",
                        cursor: "pointer",
                        color: "var(--cs-semantic-color-text-muted)",
                        borderRadius: "9999px",
                        "&:hover": {
                          bgcolor: "var(--cs-semantic-color-surface-dynamic)",
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ) : undefined,
            }}
          }}
          />

          <Box sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0 }}>
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
            {displaySchedule.map((game) => {
              const formattedTime = formatDisplayTime(game.time);
              return (
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
                                game.teamScore != null &&
                                game.teamScore > (game.oppScore ?? 0)
                                  ? "var(--cs-semantic-color-success-subtle)"
                                  : game.teamScore != null &&
                                      game.teamScore < (game.oppScore ?? 999)
                                    ? "var(--cs-semantic-color-error-subtle)"
                                    : "var(--cs-semantic-color-surface-offset)",
                              color:
                                game.teamScore != null &&
                                game.teamScore > (game.oppScore ?? 0)
                                  ? "var(--cs-semantic-color-success-text)"
                                  : game.teamScore != null &&
                                      game.teamScore < (game.oppScore ?? 999)
                                    ? "var(--cs-semantic-color-error-text)"
                                    : "var(--cs-semantic-color-text-muted)",
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
                            borderRadius: `${controlRadius}px`,
                            fontWeight: 700,
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
