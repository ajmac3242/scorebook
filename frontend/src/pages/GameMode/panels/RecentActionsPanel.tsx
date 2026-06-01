import React from "react";
import { Box, Typography, Stack, Tooltip, IconButton, Button } from "@mui/material";
import { HelpOutlined, SportsBasketball } from "@mui/icons-material";
import { MoleskineCard } from "../../../components/SharedUI";
import RecentActionItem from "../../../components/RecentActionItem";
import type { StatEvent } from "../../../db";

type RecentActionsPanelProps = {
  recentStats: StatEvent[];
  playerNamesMap: Map<string, string>;
  jerseyMap: Map<string, string>;
  isReadOnly: boolean;
  onDeleteRequest: (id: string) => void;
  onEditRequest: (stat: StatEvent) => void;
  onRecordFirstAction: () => void;
  periodLabel: string;
  opponentName?: string;
};

export const RecentActionsPanel: React.FC<RecentActionsPanelProps> = ({
  recentStats,
  playerNamesMap,
  jerseyMap,
  isReadOnly,
  onDeleteRequest,
  onEditRequest,
  onRecordFirstAction,
  periodLabel,
  opponentName,
}) => {
  const filteredStats = recentStats.filter((s) => !s.deletedAt);

  return (
    <MoleskineCard>
      <Stack
        direction="row"
        sx={{
          mb: 1,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, color: "text.secondary" }}
        >
          Recent Actions
        </Typography>
        <Tooltip
          title={
            <Box sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}>
              <strong>KEYBOARD SHORTCUTS</strong>
              <br />
              M: Make &nbsp; X: Miss &nbsp; A: Assist
              <br />
              O/D: Rebound &nbsp; T: Turnover
              <br />
              S: Steal &nbsp; B: Block &nbsp; F: Foul
              <br />
              P: Paint &nbsp; Space: Clock
              <br />
              Ctrl+Z: Undo last
            </Box>
          }
        >
          <IconButton size="small">
            <HelpOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {filteredStats.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <SportsBasketball
            sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Ready for Tip-off
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 2 }}
          >
            Tap the court or use quick actions to record live game stats.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SportsBasketball />}
            onClick={onRecordFirstAction}
            sx={{ mt: 1, fontWeight: 800 }}
          >
            Record First Action
          </Button>
        </Box>
      ) : (
        filteredStats.map((s, index) => (
          <RecentActionItem
            key={s.id || index}
            stat={s}
            playerName={
              playerNamesMap.get(s.playerId as string) ??
              opponentName ??
              "Opponent"
            }
            periodLabel={periodLabel}
            isReadOnly={isReadOnly}
            isLatest={index === 0}
            onEdit={onEditRequest}
            onDelete={onDeleteRequest}
          />
        ))
      )}
    </MoleskineCard>
  );
};
