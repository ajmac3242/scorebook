/**
 * @file RecentActionItem.tsx
 * @description Sub-component for displaying a single item in the recent actions history.
 */

import React from "react";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import {
  Check,
  Close,
  SportsBasketball,
  PanTool,
  FlashOn,
  SwapHoriz,
  ArrowBack,
  Warning,
  History,
  Groups,
  Edit,
  Delete,
} from "@mui/icons-material";
import { StatEvent } from "../../db";
import { ACTION_TYPES } from "../../constants/stats";
import { formatClock } from "../../utils/mathUtils";

interface RecentActionItemProps {
  stat: StatEvent;
  playerName: string;
  periodLabel: string;
  isReadOnly: boolean;
  isLatest?: boolean;
  onEdit: (_stat: StatEvent) => void;
  onDelete: (_id: string) => void;
}

const RecentActionItem: React.FC<RecentActionItemProps> = React.memo(
  ({
    stat,
    playerName,
    periodLabel,
    isReadOnly,
    isLatest,
    onEdit,
    onDelete,
  }) => {
    const getActionIcon = (type: string) => {
      const iconSx = {
        fontSize: 16,
        mr: "var(--cs-semantic-spacing-xs)",
        verticalAlign: "middle",
      };
      const commonProps = {
        sx: iconSx,
        role: "img",
        "aria-label": type.toLowerCase(),
      };

      switch (type) {
        case ACTION_TYPES.MAKE:
          return (
            <Check
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-success-main)",
              }}
            />
          );
        case ACTION_TYPES.MISS:
          return (
            <Close
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-error-main)",
              }}
            />
          );
        case ACTION_TYPES.REBOUND:
        case ACTION_TYPES.OFF_REBOUND:
        case ACTION_TYPES.DEF_REBOUND:
          return (
            <SportsBasketball
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-brand-primary-main)",
              }}
            />
          );
        case ACTION_TYPES.ASSIST:
          return (
            <PanTool
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-info-main)",
              }}
            />
          );
        case ACTION_TYPES.STEAL:
          return (
            <FlashOn
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-warning-main)",
              }}
            />
          );
        case ACTION_TYPES.TURNOVER:
          return (
            <SwapHoriz
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-warning-dark)",
              }}
            />
          );
        case ACTION_TYPES.BLOCK:
          return (
            <ArrowBack
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-brand-secondary-main)",
              }}
            />
          );
        case ACTION_TYPES.FOUL:
          return (
            <Warning
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-feedback-error-light)",
              }}
            />
          );
        case ACTION_TYPES.TIMEOUT:
          return (
            <History
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-text-secondary)",
              }}
            />
          );
        case ACTION_TYPES.SUB_IN:
        case ACTION_TYPES.SUB_OUT:
          return (
            <Groups
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-text-secondary)",
              }}
            />
          );
        case ACTION_TYPES.POSSESSION:
          return (
            <SwapHoriz
              {...commonProps}
              sx={{
                ...iconSx,
                color: "var(--cs-semantic-color-brand-primary-light)",
              }}
            />
          );
        default:
          return null;
      }
    };

    const timeInfo = `${periodLabel} ${stat.period || 1}${stat.clockTime !== undefined ? ` at ${formatClock(stat.clockTime)}` : ""}`;

    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Action: ${playerName} ${stat.type} during ${timeInfo}. Click to edit.`}
        onClick={() => onEdit(stat)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onEdit(stat);
          }
        }}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: "var(--cs-semantic-spacing-xs)",
          px: isLatest ? "var(--cs-semantic-spacing-xs)" : 0,
          borderBottom: "1px solid var(--cs-semantic-color-border-subtle)",
          bgcolor: isLatest ? "var(--cs-semantic-color-action-hover)" : "transparent",
          borderLeft: isLatest
            ? `4px solid var(--cs-semantic-color-brand-primary-main)`
            : "none",
          transition: `all var(--cs-motion-duration-normal) var(--cs-motion-easing-productive)`,
          cursor: "pointer",
          "&:hover": {
            bgcolor: isLatest
              ? "var(--cs-semantic-color-action-active)"
              : "var(--cs-semantic-color-action-hover)",
          },
          "&:focus-visible": {
            outline: `var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)`,
            outlineOffset: "-2px",
            borderRadius: "var(--cs-semantic-shape-radius-xs)",
            bgcolor: "var(--cs-semantic-color-action-active)",
            boxShadow: "var(--cs-elevation-shadow-card)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box sx={{ minWidth: 24, display: "flex", justifyContent: "center" }}>
            {getActionIcon(stat.type)}
          </Box>
          <Box>
            <Typography variant="body2">
              <strong>{playerName}</strong>: {stat.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {periodLabel} {stat.period || 1}
              {stat.clockTime !== undefined &&
                ` @ ${formatClock(stat.clockTime)}`}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Tooltip title={`Edit ${stat.type} for ${playerName}`}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={() => onEdit(stat)}
              aria-label={`edit ${stat.type} for ${playerName}`}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${stat.type} for ${playerName}`}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={() => onDelete(stat.id!)}
              aria-label={`delete ${stat.type} for ${playerName}`}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  },
);

export default RecentActionItem;
