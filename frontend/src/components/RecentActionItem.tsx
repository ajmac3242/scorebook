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
import { StatEvent, Player } from "../db";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../constants/stats";
import { formatClock } from "../utils/mathUtils";

interface RecentActionItemProps {
  stat: StatEvent;
  players: Player[];
  periodLabel: string;
  isReadOnly: boolean;
  teamName?: string;
  opponentName?: string;
  onEdit: (stat: StatEvent) => void;
  onDelete: (id: string) => void;
}

const RecentActionItem: React.FC<RecentActionItemProps> = React.memo(
  ({
    stat,
    players,
    periodLabel,
    isReadOnly,
    teamName,
    opponentName,
    onEdit,
    onDelete,
  }) => {
    const getOpponentName = (pId: string) => {
      if (pId === SPECIAL_PLAYER_IDS.OPPONENT)
        return opponentName || "Opponent";
      if (pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")) {
        const jersey = pId.split(":")[1];
        return `${opponentName || "Opponent"} #${jersey}`;
      }
      return null;
    };

    const playerName =
      getOpponentName(stat.playerId) ||
      (stat.playerId === SPECIAL_PLAYER_IDS.TEAM_TIMEOUT ||
      stat.playerId === SPECIAL_PLAYER_IDS.OUR_TEAM
        ? teamName || "Our Team"
        : players?.find((p) => p.id === stat.playerId)?.name || "Unknown");

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
          borderBottom: "1px solid #F0F0F0",
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
