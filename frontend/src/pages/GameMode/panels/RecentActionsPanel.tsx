import React from "react";
import { Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import { Keyboard, History, Delete } from "@mui/icons-material";
import { SurfaceCard } from "../../../components/SharedUI";
import { getPlayerDisplayName } from "../../../utils/stats";
import { formatClock } from "../../../utils/mathUtils";
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
  return (
    <SurfaceCard>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}
      >
        <Typography variant="overline" sx={{ fontWeight: 700 }}>
          Recent Actions
        </Typography>
        <Tooltip title="Keyboard Shortcuts: M (Make), X (Miss), O (Off Reb), D (Def Reb), A (Assist), T (Turnover), S (Steal), B (Block), F (Foul)">
          <IconButton size="small">
            <Keyboard fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack spacing={1}>
        {recentStats.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              cursor: isReadOnly ? "default" : "pointer",
            }}
            onClick={() => !isReadOnly && onRecordFirstAction()}
          >
            <History
              sx={{
                fontSize: 40,
                color: "text.disabled",
                mb: 1,
                opacity: 0.5,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Ready for Tip-off
            </Typography>
            {!isReadOnly && (
              <Typography variant="caption" color="primary.main">
                Click here or tap court to start
              </Typography>
            )}
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
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      p: 1,
      borderRadius: 1,
      "&:hover": { bgcolor: "var(--cs-semantic-color-bg-subtle)" },
    }}
  >
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, color: "primary.main" }}
        >
          {(stat.playerId && jerseyMap.get(stat.playerId.toString())) || "???"}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {stat.type}
          {stat.points ? ` (${stat.points}pt)` : ""}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {getPlayerDisplayName(stat.playerId?.toString() || "", playerNamesMap)}{" "}
        • {formatClock(stat.clockTime || 0)}
      </Typography>
    </Box>
    {!isReadOnly && (
      <IconButton size="small" onClick={() => onDelete(stat.id!)} color="error">
        <Delete fontSize="small" />
      </IconButton>
    )}
  </Box>
);
