import React from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { ArrowBack, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

type EntityBannerStat = {
  label: string;
  value: string | number;
};

type EntityBannerProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  backToLabel?: string;
  square?: boolean;
  gamesPlayed?: number;
  avatarColor?: string;
  primaryColor?: string;
  jerseyNumber?: string | null;
  onEdit?: () => void;
  editLabel?: string;
  stats?: EntityBannerStat[];
};

const EntityBanner: React.FC<EntityBannerProps> = ({
  title,
  subtitle,
  backTo,
  backToLabel,
  gamesPlayed,
  avatarColor = "#607d8b",
  primaryColor = "#0f5966",
  jerseyNumber,
  onEdit,
  editLabel = "Edit",
  stats = [],
}) => {
  const navigate = useNavigate();
  const initial = title?.charAt(0)?.toUpperCase() || "?";

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: primaryColor,
        color: "common.white",
        px: { xs: 2, md: 3 },
        py: { xs: 2.5, md: 3 },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          {backTo && (
            <IconButton
              aria-label={`Back to ${backToLabel || "previous page"}`}
              onClick={() => navigate(backTo)}
              sx={{
                color: "common.white",
                bgcolor: "transparent",
                alignSelf: "flex-start",
                '&:hover': { bgcolor: alpha('#ffffff', 0.12) },
              }}
            >
              <ArrowBack />
            </IconButton>
          )}

          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                width: { xs: 84, md: 112 },
                height: { xs: 84, md: 112 },
                borderRadius: "50%",
                border: `4px solid ${alpha('#ffffff', 0.35)}`,
                bgcolor: alpha(avatarColor, 0.38),
                display: "grid",
                placeItems: "center",
                fontSize: { xs: 42, md: 56 },
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {initial}
            </Box>

            {jerseyNumber && (
              <Chip
                label={jerseyNumber}
                size="small"
                sx={{
                  position: "absolute",
                  right: -6,
                  bottom: -6,
                  bgcolor: "#f2b544",
                  color: "#14313a",
                  fontWeight: 800,
                }}
              />
            )}
          </Box>

          <Stack spacing={0.25}>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="h6" sx={{ color: alpha('#ffffff', 0.88) }}>
                {subtitle}
              </Typography>
            )}
            {gamesPlayed !== undefined && (
              <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                {gamesPlayed} games
              </Typography>
            )}
          </Stack>

          {stats.length > 0 && (
            <Stack direction="row" spacing={2} sx={{ ml: { md: 2 }, flexWrap: "wrap" }}>
              {stats.map((stat) => (
                <Box key={stat.label}>
                  <Typography variant="caption" sx={{ color: alpha('#ffffff', 0.72), fontWeight: 700 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>

        {onEdit && (
          <IconButton
            aria-label={editLabel}
            onClick={onEdit}
            sx={{ color: "common.white", bgcolor: alpha('#ffffff', 0.1), '&:hover': { bgcolor: alpha('#ffffff', 0.18) } }}
          >
            <Edit />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};

export default EntityBanner;
