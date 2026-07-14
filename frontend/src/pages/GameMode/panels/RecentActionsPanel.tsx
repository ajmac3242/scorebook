import React from "react";
import { Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import { Keyboard, History, Delete } from "@mui/icons-material";
import { SurfaceCard } from "../../../components/cards/SurfaceCard";
import { getPlayerDisplayName } from "../../../utils/stats";
import { formatClock } from "../../../utils/mathUtils";
import { useTokens } from "../../../theme/useTokens";
import { EmptyState } from "../../../components/feedback";
import type { StatEvent } from "../../../db";

type RecentActionsPanelProps = {
  recentStats: StatEvent[];
  playerNamesMap: Map<string, string>;
  jerseyMap: Map<string, string>;
  isReadOnly: boolean;
  onDeleteRequest: (_id: string) => void;
  onRecordFirstAction: () => void;
};

export const RecentActionsPanel: React.FC<RecentActionsPanelProps> = ({
  recentStats,
  playerNamesMap,
  jerseyMap,
  isReadOnly,
  onDeleteRequest,
  onRecordFirstAction,
}) => {
  const tokens = useTokens();

  return (
    <SurfaceCard>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: tokens.semantic.spacing.xs / 8,
        }}
      >
        <Typography
          variant="overline"
          sx={{ fontWeight: tokens.typography.fontWeight.bold }}
        >
          Recent Actions
        </Typography>
        <Tooltip title="Keyboard Shortcuts: M (Make), X (Miss), O (Off Reb), D (Def Reb), A (Assist), T (Turnover), S (Steal), B (Block), F (Foul)">
          <IconButton size="small" aria-label="Keyboard shortcuts info">
            <Keyboard fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack spacing={tokens.semantic.spacing.xs / 8}>
        {recentStats.length === 0 ? (
          <Box
            onClick={() => !isReadOnly && onRecordFirstAction()}
            sx={{
              cursor: isReadOnly ? "default" : "pointer",
              borderRadius: tokens.semantic.shape.radius["2xl"],
              overflow: "hidden",
            }}
          >
            <EmptyState
              icon={
                <History
                  sx={{
                    fontSize: tokens.semantic.component.iconSize.xl,
                    color: tokens.semantic.color.text.disabled,
                    opacity: 0.5,
                  }}
                />
              }
              title="Ready for Tip-off"
              description={
                isReadOnly
                  ? "No actions recorded for this game."
                  : "Tap the court or click here to start recording actions."
              }
            />
          </Box>
        ) : (
          recentStats.map((stat) => (
            <RecentActionItem
              key={stat.id}
              stat={stat}
              playerNamesMap={playerNamesMap}
              jerseyMap={jerseyMap}
              isReadOnly={isReadOnly}
              onDelete={onDeleteRequest}
            />
          ))
        )}
      </Stack>
    </SurfaceCard>
  );
};

const RecentActionItem = ({
  stat,
  playerNamesMap,
  jerseyMap,
  isReadOnly,
  onDelete,
}: {
  stat: StatEvent;
  playerNamesMap: Map<string, string>;
  jerseyMap: Map<string, string>;
  isReadOnly: boolean;
  onDelete: (_id: string) => void;
}) => {
  const tokens = useTokens();
  const playerDisplay = getPlayerDisplayName(
    stat.playerId?.toString() || "",
    playerNamesMap,
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: tokens.semantic.spacing.xs / 8,
        borderRadius: tokens.semantic.shape.radius.xs / 8,
        "&:hover": { bgcolor: tokens.semantic.color.surface.subtle },
      }}
    >
      <Box>
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.xs / 8}
          sx={{ alignItems: "center" }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: tokens.typography.fontWeight.black,
              color: tokens.semantic.color.brand.primary.main,
            }}
          >
            {(stat.playerId && jerseyMap.get(stat.playerId.toString())) ||
              "???"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontWeight: tokens.typography.fontWeight.bold }}
          >
            {stat.type}
            {stat.points ? ` (${stat.points}pt)` : ""}
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          {playerDisplay} • {formatClock(stat.clockTime || 0)}
        </Typography>
      </Box>
      {!isReadOnly && (
        <Tooltip title={`Delete ${stat.type} action`}>
          <IconButton
            size="small"
            onClick={() => onDelete(stat.id!)}
            color="error"
            aria-label={`Delete ${stat.type} action for ${playerDisplay}`}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};
