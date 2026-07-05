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
import { useTokens } from "../../theme/useTokens";

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
    const tokens = useTokens();
    const getActionIcon = (type: string) => {
      const iconSx = {
        fontSize: tokens.semantic.component.iconSize.xs,
        mr: tokens.semantic.spacing.xs / 8,
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
                color: tokens.semantic.color.feedback.success.main,
              }}
            />
          );
        case ACTION_TYPES.MISS:
          return (
            <Close
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.feedback.error.main,
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
                color: tokens.semantic.color.brand.primary.main,
              }}
            />
          );
        case ACTION_TYPES.ASSIST:
          return (
            <PanTool
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.feedback.info.main,
              }}
            />
          );
        case ACTION_TYPES.STEAL:
          return (
            <FlashOn
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.feedback.warning.main,
              }}
            />
          );
        case ACTION_TYPES.TURNOVER:
          return (
            <SwapHoriz
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.feedback.warning.dark,
              }}
            />
          );
        case ACTION_TYPES.BLOCK:
          return (
            <ArrowBack
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.brand.secondary.main,
              }}
            />
          );
        case ACTION_TYPES.FOUL:
          return (
            <Warning
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.feedback.error.light,
              }}
            />
          );
        case ACTION_TYPES.TIMEOUT:
          return (
            <History
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.text.secondary,
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
                color: tokens.semantic.color.text.secondary,
              }}
            />
          );
        case ACTION_TYPES.POSSESSION:
          return (
            <SwapHoriz
              {...commonProps}
              sx={{
                ...iconSx,
                color: tokens.semantic.color.brand.primary.light,
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
        aria-label={`${isLatest ? "Latest " : ""}Action: ${playerName} ${stat.type} during ${timeInfo}. Click to edit.`}
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
          py: tokens.semantic.spacing.xs / 8,
          px: isLatest ? tokens.semantic.spacing.xs / 8 : tokens.semantic.spacing.xs / 16,
          borderBottom: "1px solid",
          borderColor: tokens.semantic.color.border.subtle,
          bgcolor: isLatest
            ? tokens.semantic.color.action.hover
            : "transparent",
          borderLeft: isLatest
            ? `4px solid ${tokens.semantic.color.brand.primary.main}`
            : "none",
          transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          cursor: "pointer",
          "&:hover": {
            bgcolor: isLatest
              ? tokens.semantic.color.action.active
              : tokens.semantic.color.action.hover,
          },
          "&:focus-visible": {
            outline: `${tokens.semantic.focus.width} solid var(--cs-semantic-color-action-focusRing)`,
            outlineOffset: "-2px",
            borderRadius: tokens.semantic.shape.radius.xs / 8,
            bgcolor: tokens.semantic.color.action.active,
            boxShadow: tokens.semantic.elevation.shadow.card,
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
            <Typography
              variant="caption"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
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
              onClick={(e) => {
                e.stopPropagation();
                onEdit(stat);
              }}
              aria-label={`edit ${stat.type} for ${playerName}`}
              aria-haspopup="dialog"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${stat.type} for ${playerName}`}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stat.id!);
              }}
              aria-label={`delete ${stat.type} for ${playerName}`}
              aria-haspopup="dialog"
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
