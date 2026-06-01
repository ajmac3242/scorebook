import React from "react";
import {
  Avatar,
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  History,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTokens } from "../../../theme/useTokens";
import KpiStat from "../../../components/KpiStat";
import { getInitials } from "../../../utils/stats";
import { type PlayerWithStats } from "../hooks/usePlayersData";

type PlayerGridCardProps = {
  player: PlayerWithStats;
  handleRestorePlayer: (_id: string) => Promise<void>;
  handleToggleStar: (_e: React.MouseEvent, _id: string, _currentIsStar: number | undefined) => Promise<void>;
};

const PlayerGridCard: React.FC<PlayerGridCardProps> = ({
  player,
  handleRestorePlayer,
  handleToggleStar,
}) => {
  const tokens = useTokens();
  const navigate = useNavigate();

  const getAccentStyles = (accentColor?: string) => {
    const accent = accentColor || "var(--cs-semantic-color-primary-main)";

    return {
      accent,
      accentSoft: alpha(accent, 0.12),
      accentSoftStrong: alpha(accent, 0.18),
      accentBorder: alpha(accent, 0.3),
      accentFocus: alpha(accent, 0.22),
    };
  };

  const {
    accent,
    accentSoft,
    accentSoftStrong,
    accentBorder,
    accentFocus,
  } = getAccentStyles(player.avatarColor);

  return (
    <Grid size={{ xs: 12, md: 6, xl: 4 }} key={player.id}>
      <Paper
        role="button"
        tabIndex={0}
        elevation={0}
        aria-label={
          player.isArchived
            ? `Restore ${player.name}`
            : `View player dashboard for ${player.name}`
        }
        onClick={() =>
          player.isArchived
            ? handleRestorePlayer(player.id!)
            : navigate(`/players/${player.id}`)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (player.isArchived) {
              handleRestorePlayer(player.id!);
            } else {
              navigate(`/players/${player.id}`);
            }
          }
        }}
        sx={{
          height: "100%",
          borderRadius: tokens.semantic.component.sectionCard.radius,
          border: "1px solid",
          borderColor: player.isStar ? accentBorder : "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          cursor: "pointer",
          opacity: player.isArchived ? 0.72 : 1,
          transition: "transform 150ms, box-shadow 150ms, border-color 150ms, background-color 150ms",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "var(--cs-semantic-shadow-md)",
            borderColor: accentBorder,
          },
          "&:focus-visible": {
            outline: "none",
            boxShadow: `0 0 0 3px ${accentFocus}`,
            borderColor: accent,
          },
        }}
      >
        <Box
          sx={{
            height: 6,
            bgcolor: accent,
          }}
        />

        <Box
          sx={{
            p: { xs: 2, sm: 2.25 },
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  mb: 0.75,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h6">
                  {player.name}
                </Typography>

                {Boolean(player.isArchived) && (
                  <Chip
                    label="Archived"
                    size="small"
                    icon={<History />}
                    sx={{
                      borderRadius: tokens.semantic.component.radius.input,
                      bgcolor: "action.hover",
                      color: "text.secondary",
                      "& .MuiChip-icon": {
                        color: "text.secondary",
                      },
                    }}
                  />
                )}

                {Boolean(player.isStar) && (
                  <Chip
                    label="Starred"
                    size="small"
                    sx={{
                      borderRadius: tokens.semantic.component.radius.input,
                      bgcolor: accentSoft,
                      color: "text.primary",
                      border: "1px solid",
                      borderColor: accentBorder,
                    }}
                  />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {player.isArchived
                  ? "Archived player. Select to restore to the active roster."
                  : "Track player performance and open detailed individual stats."}
              </Typography>
            </Box>

            <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
              <Tooltip
                title={
                  player.isStar
                    ? "Remove star player"
                    : "Mark as star player"
                }
              >
                <IconButton
                  size="small"
                  onClick={(e) =>
                    handleToggleStar(e, player.id!, player.isStar)
                  }
                  aria-label={
                    player.isStar
                      ? `Remove ${player.name} from starred players`
                      : `Mark ${player.name} as star player`
                  }
                  sx={{
                    color: player.isStar
                      ? accent
                      : "text.secondary",
                    bgcolor: player.isStar
                      ? accentSoft
                      : "transparent",
                    "&:hover": {
                      bgcolor: accentSoftStrong,
                    },
                  }}
                >
                  {player.isStar ? (
                    <StarIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Tooltip>

              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: accentSoft,
                  color: accent,
                  border: "1px solid",
                  borderColor: accentBorder,
                  fontWeight: 700,
                }}
              >
                {getInitials(player.name)}
              </Avatar>
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: tokens.semantic.component.sectionCard.radius,
              px: 2,
              py: 1.75,
              mb: 2,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              sx={{
                fontSize: "var(--cs-typography-fontSize-xs)",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: "text.secondary",
                mb: 1.5,
              }}
            >
              Average stats
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 4 }}>
                <KpiStat label="PPG" value={player.ppg} size="sm" />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <KpiStat label="RPG" value={player.rpg} size="sm" />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <KpiStat label="APG" value={player.apg} size="sm" />
              </Grid>
            </Grid>
          </Box>

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mt: "auto",
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {player.isArchived
                ? "Restore player"
                : "Open player dashboard"}
            </Typography>

            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: accent,
                border: "1px solid",
                borderColor: "rgba(0, 0, 0, 0.08)",
                flexShrink: 0,
              }}
            />
          </Stack>
        </Box>
      </Paper>
    </Grid>
  );
};

export default PlayerGridCard;
