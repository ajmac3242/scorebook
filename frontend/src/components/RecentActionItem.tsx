/**
 * @file RecentActionItem.tsx
 * @description Sub-component for displaying a single item in the recent actions history.
 */

import React from "react";
import { Box, Typography, Tooltip, IconButton, useTheme } from "@mui/material";
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
  CloudUpload,
  CloudDone,
  Star,
  StarBorder,
} from "@mui/icons-material";
import { StatEvent } from "../db";
import { ACTION_TYPES } from "../constants/stats";
import { formatClock } from "../utils/mathUtils";

interface RecentActionItemProps {
  stat: StatEvent;
  playerName: string;
  periodLabel: string;
  isReadOnly: boolean;
  isLatest?: boolean;
  onEdit: (_stat: StatEvent) => void;
  onDelete: (_id: string) => void;
  onToggleBookmark?: (_id: string, _currentStatus: number | undefined) => void;
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
    onToggleBookmark,
  }) => {
    const theme = useTheme();
    const getActionIcon = (type: string) => {
      const iconSx = { fontSize: 16, mr: 1, verticalAlign: "middle" };
      switch (type) {
        case ACTION_TYPES.MAKE:
          return <Check sx={{ ...iconSx, color: "success.main" }} />;
        case ACTION_TYPES.MISS:
          return <Close sx={{ ...iconSx, color: "error.main" }} />;
        case ACTION_TYPES.REBOUND:
        case ACTION_TYPES.OFF_REBOUND:
        case ACTION_TYPES.DEF_REBOUND:
          return <SportsBasketball sx={{ ...iconSx, color: "primary.main" }} />;
        case ACTION_TYPES.ASSIST:
          return <PanTool sx={{ ...iconSx, color: "info.main" }} />;
        case ACTION_TYPES.STEAL:
          return <FlashOn sx={{ ...iconSx, color: "warning.main" }} />;
        case ACTION_TYPES.TURNOVER:
          return <SwapHoriz sx={{ ...iconSx, color: "warning.dark" }} />;
        case ACTION_TYPES.BLOCK:
          return <ArrowBack sx={{ ...iconSx, color: "secondary.main" }} />;
        case ACTION_TYPES.FOUL:
          return <Warning sx={{ ...iconSx, color: "error.light" }} />;
        case ACTION_TYPES.TIMEOUT:
          return <History sx={{ ...iconSx, color: "text.secondary" }} />;
        case ACTION_TYPES.SUB_IN:
        case ACTION_TYPES.SUB_OUT:
          return <Groups sx={{ ...iconSx, color: "text.secondary" }} />;
        case ACTION_TYPES.POSSESSION:
          return <SwapHoriz sx={{ ...iconSx, color: "primary.light" }} />;
        default:
          return null;
      }
    };

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 0.5,
          px: isLatest ? 1 : 0,
          borderBottom: "1px solid #F0F0F0",
          bgcolor: isLatest ? "rgba(0, 0, 0, 0.03)" : "transparent",
          borderLeft: isLatest
            ? `4px solid ${theme.palette.primary.main}`
            : "none",
          transition: "all 0.3s ease",
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* 🏀 Assistant Coach: Sync Status Indicator */}
          <Tooltip title={stat.synced ? "Synced to Cloud" : "Syncing to Cloud..."}>
            <Box
              sx={{ mr: 1, display: "flex" }}
              role="status"
              aria-label={stat.synced ? "Synced to cloud" : "Syncing to cloud..."}
            >
              {stat.synced ? (
                <CloudDone sx={{ fontSize: 16, color: "success.light", opacity: 0.7 }} />
              ) : (
                <CloudUpload sx={{ fontSize: 16, color: "warning.main", opacity: 0.8 }} />
              )}
            </Box>
          </Tooltip>

          <Tooltip title={!!stat.isBookmarked ? "Remove Bookmark" : "Bookmark for Review"}>
            <IconButton
              size="small"
              disabled={isReadOnly}
              onClick={() => onToggleBookmark?.(stat.id!, stat.isBookmarked)}
              aria-label={!!stat.isBookmarked ? "remove bookmark" : "bookmark for review"}
              color={!!stat.isBookmarked ? "warning" : "default"}
            >
              {!!stat.isBookmarked ? (
                <Star fontSize="small" />
              ) : (
                <StarBorder fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

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
