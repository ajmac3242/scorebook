import React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { alpha } from "@mui/material/styles";
import { type Game, type Team } from "../../../db";
import { getInitials } from "../../../utils/stats";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import PageSectionIntro from "../../../components/layout/PageSectionIntro";
import EntityRowCard from "../../../components/cards/EntityRowCard";
import EmptyState from "../../../components/EmptyState";

type ScheduleTabProps = {
  filteredSchedule: Game[];
  scheduleView: "upcoming" | "all";
  setScheduleView: (v: "upcoming" | "all") => void;
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
  const navigate = useNavigate();
  const sectionPadding = { xs: 2.5, md: 0 };

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Schedule"
            description="Manage upcoming games and review the full schedule for this team."
          />
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{
            mb: 3,
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <ToggleButtonGroup
            value={scheduleView}
            exclusive
            onChange={(_, val) => val && setScheduleView(val)}
            size="small"
            fullWidth={isMobile}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                borderRadius: `${controlRadius}px !important`,
                px: 1.75,
              },
            }}
          >
            <ToggleButton value="upcoming">Upcoming</ToggleButton>
            <ToggleButton value="all">All games</ToggleButton>
          </ToggleButtonGroup>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateGame}
            disabled={isDeleted}
            sx={{
              borderRadius: `${controlRadius}px`,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              minHeight: 36,
              alignSelf: { xs: "stretch", md: "center" },
            }}
          >
            Create game
          </Button>
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

                    <Button
                      variant="text"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game/stats?gameId=${game.id}`);
                      }}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: "text.secondary",
                      }}
                    >
                      Open
                    </Button>
                  </>
                }
                onClick={() => navigate(`/game/stats?gameId=${game.id}`)}
                ariaLabel={`Open game details for ${game.opponent}`}
              />
            ))}
          </Stack>
        )}
      </Box>
    </PageSectionCard>
  );
};

export default ScheduleTab;
