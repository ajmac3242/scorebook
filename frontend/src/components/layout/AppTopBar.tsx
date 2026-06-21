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
        bgcolor: "var(--cs-semantic-color-background-paper)",
        height: "var(--cs-semantic-spacing-appBarHeight)",
        justifyContent: "center",
        boxShadow: "none",
        borderBottom: "none",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          px: { xs: 1.5, sm: 2 },
          minHeight: "unset !important",
          gap: 1,
        }}
      >
        {/* Left: Logo + team switcher chip */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}
        >
          <CourtSightLogo width={32} />
          <Chip
            label={teamName}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              borderColor: "var(--cs-semantic-color-border-default)",
              color: "var(--cs-semantic-color-text-primary)",
              cursor: "pointer",
              transition:
                "all var(--cs-motion-duration-fast) var(--cs-motion-easing-productive)",
              "&:hover": { bgcolor: "var(--cs-semantic-color-action-hover)" },
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
              border: "1px solid var(--cs-semantic-color-border-subtle)",
              borderRadius: "var(--cs-semantic-shape-radius-md)",
              px: 1.5,
              gap: 0.5,
              color: "var(--cs-semantic-color-text-secondary)",
              transition:
                "all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
              "&:hover": {
                bgcolor: "var(--cs-semantic-color-action-hover)",
                borderColor: "var(--cs-semantic-color-border-default)",
              },
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Right: SyncBadge + notifications + avatar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flexShrink: 0,
          }}
        >
          <SyncBadge isLive={isLive} />
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              aria-label="View notifications"
              sx={{
                color: "var(--cs-semantic-color-text-secondary)",
                transition:
                  "all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)",
                "&:hover": { color: "var(--cs-semantic-color-text-primary)" },
              }}
            >
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Account settings">
            <Avatar
              role="button"
              tabIndex={0}
              aria-label="Account settings"
              sx={{
                width: 32,
                height: 32,
                bgcolor: "var(--cs-semantic-color-brand-primary-main)",
                fontSize: "var(--cs-typography-fontSize-xs)",
                fontWeight: 700,
                cursor: "pointer",
                transition:
                  "transform var(--cs-motion-duration-fast) var(--cs-motion-easing-productive)",
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
