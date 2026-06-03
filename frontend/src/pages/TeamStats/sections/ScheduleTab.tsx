import React, { useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Fab,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  useTheme,
} from "@mui/material";
import { Add as AddIcon, Groups as GroupsIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { alpha } from "@mui/material/styles";
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

const DEFAULT_TEAM_ACCENT = "#154C56";

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
  const theme = useTheme();
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
            <Tooltip title={isDeleted ? "" : "Create game"} placement="left">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onCreateGame}
                  disabled={isDeleted}
                  startIcon={<AddIcon />}
                  aria-label="Create game"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: `${controlRadius}px`,
                    boxShadow: "none",
                    display: { sm: "none", md: "inline-flex" },
                    "&.Mui-disabled": { opacity: 0.4 },
                  }}
                >
                  Add game
                </Button>
                <IconButton
                  size="small"
                  onClick={onCreateGame}
                  disabled={isDeleted}
                  aria-label="Create game"
                  sx={{
                    bgcolor: "var(--cs-semantic-color-brand-primary-main)",
                    color: "white",
                    width: 32,
                    height: 32,
                    display: { sm: "flex", md: "none" },
                    "&:hover": {
                      bgcolor: "var(--cs-semantic-color-brand-primary-dark)",
                    },
                    "&.Mui-disabled": { opacity: 0.4 },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Stack>

        {filteredSchedule.length === 0 ? (
          <EmptyState
            icon={<GroupsIcon sx={{ fontSize: 30 }} />}
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
                        borderRadius: "12px",
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
                    {dayjs(game.date).format("MMM D, YYYY")}
                    {game.time ? ` • ${game.time}` : ""}
                    {game.location ? ` • ${game.location}` : ""}
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
                  ) : (
                    <Chip
                      label="Scheduled"
                      size="small"
                      sx={{
                        bgcolor: alpha(
                          team?.primaryColor || DEFAULT_TEAM_ACCENT,
                          0.1,
                        ),
                        color: team?.primaryColor || DEFAULT_TEAM_ACCENT,
                        border: "none",
                        fontWeight: 600,
                        fontSize: "var(--cs-typography-fontSize-xs)",
                      }}
                    />
                  )
                }
                actions={
                  <>
                    {!game.completed ? (
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
                        }}
                      >
                        Track
                      </Button>
                    ) : null}
                  </>
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
            boxShadow: theme.shadows[6],
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </PageSectionCard>
  );
};

export default ScheduleTab;
