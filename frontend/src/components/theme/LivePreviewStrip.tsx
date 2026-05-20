import React from "react";
import { Box, Typography, Button, Chip, Avatar, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SportBasketballIcon from "@mui/icons-material/SportsBasketball";

/**
 * DESIGN-011-D: LivePreviewStrip
 * Shows a miniature preview of how the current theme looks across
 * key UI elements: app bar colour, primary button, chip, avatar, and text.
 * Updates in real-time as the user selects presets or adjusts custom colours.
 */
const LivePreviewStrip: React.FC = () => {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 2,
        mt: 3,
      }}
    >
      {/* Mini app bar */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <SportBasketballIcon sx={{ color: "primary.main", fontSize: 20 }} />
        <Typography
          variant="subtitle2"
          color="text.primary"
          sx={{ fontWeight: 700 }}
        >
          CourtSight
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          label="LIVE"
          size="small"
          sx={{
            bgcolor: "primary.main",
            color: theme.palette.getContrastText(theme.palette.primary.main),
            fontWeight: 700,
            fontSize: "0.65rem",
            height: 20,
          }}
        />
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: "primary.main",
            fontSize: "0.7rem",
          }}
        >
          C
        </Avatar>
      </Box>

      {/* Content area */}
      <Box
        sx={{
          bgcolor: "background.default",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <Button variant="contained" size="small" disableElevation>
          Primary
        </Button>
        <Button variant="outlined" size="small">
          Secondary
        </Button>
        <Chip label="Tag" size="small" />
        <Typography variant="body2" color="text.primary">
          Body text
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Secondary text
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="caption" color="text.disabled">
          Preview — {theme.palette.mode} mode
        </Typography>
      </Box>
    </Paper>
  );
};

export default LivePreviewStrip;
