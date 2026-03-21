import React from "react";
import {
  Box,
  Typography,
  Grid,
  Avatar,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { StatItem } from "./SharedUI";
import { getInitials } from "../utils/stats";
import { Refresh as RefreshIcon } from "@mui/icons-material";

interface EntityBannerProps {
  title: string;
  subtitle?: string;
  avatarSrc?: string;
  avatarColor?: string;
  backTo?: string;
  primaryColor?: string;
  stats?: Array<{ label: string; value: string | number }>;
  actions?: React.ReactNode;
  onSync?: () => void;
  isSyncing?: boolean;
  jerseyNumber?: string;
}

/**
 * Standardized banner component for entities (Teams, Players).
 * Includes an avatar, title, subtitle, stats summary, and action buttons.
 *
 * @param {EntityBannerProps} props - Component props.
 * @returns {React.ReactElement}
 */
const EntityBanner: React.FC<EntityBannerProps> = ({
  title,
  subtitle,
  avatarSrc,
  avatarColor,
  backTo,
  primaryColor = "#154C56",
  stats = [],
  actions,
  onSync,
  isSyncing = false,
  jerseyNumber,
}) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        p: 4,
        mb: 0,
        borderRadius: "8px",
        bgcolor: primaryColor,
        color: "white",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.3s ease",
      }}
    >
      <IconButton
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          color: "white",
          bgcolor: "rgba(255,255,255,0.1)",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.2)",
            transform: "scale(1.1)",
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Grid container alignItems="center" spacing={4} sx={{ mt: 1 }}>
        <Grid item>
          <Box sx={{ position: "relative" }}>
            {avatarSrc ? (
              <Box
                component="img"
                src={avatarSrc}
                sx={{
                  width: { xs: 80, md: 120 },
                  height: "auto",
                  filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: { xs: 80, md: 120 },
                  height: { xs: 80, md: 120 },
                  bgcolor: avatarColor || "rgba(255,255,255,0.2)",
                  fontSize: "3rem",
                  border: "4px solid rgba(255,255,255,0.3)",
                }}
              >
                {getInitials(title)}
              </Avatar>
            )}
            {jerseyNumber && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: -5,
                  right: -5,
                  bgcolor: "var(--palette-golden-dune)",
                  color: "var(--palette-midnight)",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  border: "3px solid white",
                  zIndex: 2,
                }}
              >
                {jerseyNumber}
              </Box>
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "var(--serif)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "white",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="h6"
              sx={{ opacity: 0.9, fontWeight: 500, color: "white" }}
            >
              {subtitle}
            </Typography>
          )}
        </Grid>
        {stats.length > 0 && (
          <Grid item xs={12} md="auto">
            <Stack direction="row" spacing={4}>
              {stats.map((stat) => (
                <StatItem
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  light
                />
              ))}
            </Stack>
          </Grid>
        )}
      </Grid>
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          gap: 1,
        }}
      >
        {onSync && (
          <Button
            variant="outlined"
            size="small"
            startIcon={
              isSyncing ? <RefreshIcon className="spin" /> : <RefreshIcon />
            }
            onClick={onSync}
            disabled={isSyncing}
            className="hover-grow"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": {
                borderColor: "white",
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        )}
        {actions}
      </Box>
    </Box>
  );
};

export default EntityBanner;
