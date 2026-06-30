import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CourtSightLogo from "../CourtSightLogo";
import SyncBadge from "./SyncBadge";
import { useTokens } from "../../theme/useTokens";

export interface AppTopBarProps {
  /** Name of the currently starred / active team */
  teamName?: string;
  /** Whether a live game sync is active */
  isLive?: boolean;
  /** Called when the OmniSearch trigger is pressed */
  onSearchOpen?: () => void;
}

const AppTopBar: React.FC<AppTopBarProps> = ({
  teamName = "My Team",
  isLive = false,
  onSearchOpen,
}) => {
  const tokens = useTokens();
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: tokens.semantic.color.background.paper,
        height: tokens.semantic.spacing.appBarHeight,
        justifyContent: "center",
        boxShadow: "none",
        borderBottom: "none",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: {
            xs: tokens.spacing[1.5] / 4,
            sm: tokens.spacing[2] / 4,
          },
          minHeight: "unset !important",
          gap: tokens.spacing[1] / 4,
        }}
      >
        {/* Left: Logo + team switcher chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: tokens.semantic.spacing.xs / 4,
            flexShrink: 0,
          }}
        >
          <CourtSightLogo width={32} />
          <Chip
            label={teamName}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: tokens.typography.fontWeight.semibold,
              fontSize: tokens.typography.fontSize.xs,
              borderColor: tokens.semantic.color.border.default,
              color: tokens.semantic.color.text.primary,
              cursor: "pointer",
              transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
              "&:hover": { bgcolor: tokens.semantic.color.action.hover },
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Center: OmniSearch trigger */}
        <Tooltip title="Search (⌘K)">
          <IconButton
            onClick={onSearchOpen}
            aria-label="Open search"
            size="small"
            sx={{
              border: `1px solid ${tokens.semantic.color.border.subtle}`,
              borderRadius: `${tokens.semantic.shape.radius.md}px`,
              px: tokens.semantic.spacing.sm / 4,
              gap: tokens.semantic.spacing.xs / 4,
              color: tokens.semantic.color.text.secondary,
              transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
              "&:hover": {
                bgcolor: tokens.semantic.color.action.hover,
                borderColor: tokens.semantic.color.border.default,
              },
            }}
          >
            <SearchIcon
              sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
            />
          </IconButton>
        </Tooltip>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right: SyncBadge + notifications + avatar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: tokens.semantic.spacing.xs / 4,
            flexShrink: 0,
          }}
        >
          <SyncBadge isLive={isLive} />
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              aria-label="View notifications"
              sx={{
                color: tokens.semantic.color.text.secondary,
                transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
                "&:hover": { color: tokens.semantic.color.text.primary },
              }}
            >
              <NotificationsNoneOutlinedIcon
                sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title="Account settings">
            <Avatar
              role="button"
              tabIndex={0}
              aria-label="Account settings"
              sx={{
              width: tokens.spacing[8],
              height: tokens.spacing[8],
                bgcolor: tokens.semantic.color.brand.primary.main,
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
                cursor: "pointer",
                transition: `transform ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
                "&:hover": { transform: "scale(1.05)" },
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              C
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppTopBar;
