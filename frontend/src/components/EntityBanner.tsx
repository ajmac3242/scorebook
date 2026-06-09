import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import {
  ArrowBack,
  Close as CloseIcon,
  Edit,
  Search as SearchIcon,
  Sync,
} from "@mui/icons-material";
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
  avatarSrc?: string;
  avatarColor?: string;
  primaryColor?: string;
  jerseyNumber?: string | null;
  onEdit?: () => void;
  editLabel?: string;
  onSearchChange?: (_value: string) => void;
  searchTerm?: string;
  onSync?: () => void;
  actions?: React.ReactNode;
  extraActions?: React.ReactNode;
  stats?: EntityBannerStat[];
};

const EntityBanner: React.FC<EntityBannerProps> = ({
  title,
  subtitle,
  backTo,
  backToLabel,
  gamesPlayed,
  avatarSrc,
  avatarColor = "#607d8b",
  primaryColor = "#0f5966",
  jerseyNumber,
  onEdit,
  editLabel = "Edit",
  onSearchChange,
  searchTerm = "",
  onSync,
  actions,
  extraActions,
  stats = [],
}) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [didSync, setDidSync] = useState(false);
  const initials =
    title
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";

  const handleSync = () => {
    onSync?.();
    setDidSync(true);
  };

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
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
        >
          {backTo && (
            <IconButton
              aria-label={`Back to ${backToLabel || "previous page"}`}
              onClick={() => navigate(backTo)}
              sx={{
                color: "common.white",
                bgcolor: "transparent",
                alignSelf: "flex-start",
                "&:hover": { bgcolor: alpha("#ffffff", 0.12) },
              }}
            >
              <ArrowBack />
            </IconButton>
          )}

          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Box
              sx={{
                width: { xs: 84, md: 112 },
                height: { xs: 84, md: 112 },
                borderRadius: "50%",
                border: `4px solid ${alpha("#ffffff", 0.35)}`,
                bgcolor: avatarSrc
                  ? alpha("#ffffff", 0.08)
                  : alpha(avatarColor || "#607d8b", 0.38),
                backgroundImage: avatarSrc ? `url(${avatarSrc})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "grid",
                placeItems: "center",
                fontSize: { xs: 42, md: 56 },
                fontWeight: 700,
                lineHeight: 1,
                overflow: "hidden",
              }}
            >
              {!avatarSrc && initials}
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

          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="h6" sx={{ color: alpha("#ffffff", 0.88) }}>
                {subtitle}
              </Typography>
            )}
            {gamesPlayed !== undefined && (
              <Typography
                variant="body2"
                sx={{ color: alpha("#ffffff", 0.72) }}
              >
                {gamesPlayed} games
              </Typography>
            )}
          </Stack>

          {stats.length > 0 && (
            <Stack
              direction="row"
              spacing={2}
              sx={{ ml: { md: 2 }, flexWrap: "wrap", alignItems: "center" }}
            >
              {stats.map((stat) => (
                <Box key={stat.label}>
                  <Typography
                    variant="caption"
                    sx={{ color: alpha("#ffffff", 0.72), fontWeight: 700 }}
                  >
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

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexShrink: 0 }}
        >
          {actions}

          {onSearchChange &&
            (searchOpen ? (
              <TextField
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{
                  minWidth: { xs: 160, sm: 220 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 999,
                    bgcolor: alpha("#ffffff", 0.08),
                    color: "common.white",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: alpha("#ffffff", 0.2),
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: alpha("#ffffff", 0.72) }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="close search"
                          onClick={() => setSearchOpen(false)}
                          size="small"
                          sx={{ color: alpha("#ffffff", 0.72) }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ) : (
              <IconButton
                aria-label="search"
                onClick={() => setSearchOpen(true)}
                sx={{
                  color: "common.white",
                  bgcolor: alpha("#ffffff", 0.1),
                  "&:hover": { bgcolor: alpha("#ffffff", 0.18) },
                }}
              >
                <SearchIcon />
              </IconButton>
            ))}

          {onSync && (
            <Button
              variant="outlined"
              startIcon={<Sync />}
              onClick={handleSync}
              sx={{
                color: "common.white",
                borderColor: alpha("#ffffff", 0.28),
                textTransform: "none",
                borderRadius: 999,
                "&:hover": {
                  borderColor: alpha("#ffffff", 0.4),
                  bgcolor: alpha("#ffffff", 0.08),
                },
              }}
            >
              {didSync ? "Synced" : "Sync"}
            </Button>
          )}

          {onEdit && (
            <Tooltip title={editLabel}>
              <IconButton
                aria-label={editLabel}
                onClick={onEdit}
                sx={{
                  color: "common.white",
                  bgcolor: alpha("#ffffff", 0.1),
                  "&:hover": { bgcolor: alpha("#ffffff", 0.18) },
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}

          {extraActions}
        </Stack>
      </Stack>
    </Box>
  );
};

export default EntityBanner;
