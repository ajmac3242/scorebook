import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Alert,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { MoleskineCard } from "../../../components/layout/MoleskineCard";
import { StatValue } from "../../../components/display/StatValue";
import { PlaybookEfficiencyWidget } from "../GameModeComponents";

import type { PlayerAggregates, SortConfig, ChainPrompt, PlaybookEfficiency } from "../../../types/stats";


type PlayerPerformancePanelProps = {
  sortedStatsGridData: PlayerAggregates[];
  sortConfig: SortConfig;
  onSortChange: (_key: keyof PlayerAggregates) => void;
  jerseyMap: Map<string, string>;
  draftOnCourtIds: Set<string>;
  chainPrompt: ChainPrompt | null;
  onChainPromptDismiss: () => void;
  playbookEfficiency: PlaybookEfficiency | null;

  gameId: string;
  period: number;
  clockSeconds: number;
  isReadOnly: boolean;
};

export const PlayerPerformancePanel: React.FC<PlayerPerformancePanelProps> = ({
  sortedStatsGridData,
  sortConfig,
  onSortChange,
  jerseyMap,
  draftOnCourtIds,
  chainPrompt,
  onChainPromptDismiss,
  playbookEfficiency,

  isReadOnly,
}) => {


  return (
    <Box sx={{ mb: 3 }}>
      {chainPrompt && !isReadOnly && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            mb: 2,
            backgroundColor: "var(--cs-semantic-color-info-subtle)",
            border: "1px solid var(--cs-semantic-color-info-main)",
            "& .MuiAlert-message": { width: "100%" },
          }}
          action={
            <IconButton
              size="small"
              onClick={onChainPromptDismiss}
              aria-label="dismiss prompt"
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {chainPrompt.message}
          </Typography>
          <Typography variant="caption">{chainPrompt.subtext}</Typography>
        </Alert>
      )}

      {playbookEfficiency && (
        <PlaybookEfficiencyWidget efficiency={playbookEfficiency} />
      )}

      <MoleskineCard title="Player Performance">
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>#</TableCell>
                {[
                  { id: "points", label: "PTS" },
                  { id: "fgPct", label: "FG%" },
                  { id: "assists", label: "AST" },
                  { id: "rebounds", label: "REB" },
                  { id: "efficiency", label: "EFF" },
                ].map((col) => (
                  <TableCell
                    key={col.id}
                    align="right"
                    sx={{
                      py: 1.5,
                      borderLeft: "1px solid var(--cs-semantic-color-border-subtle)",
                    }}
                  >
                    <TableSortLabel
                      active={sortConfig.key === col.id}
                      direction={
                        sortConfig.key === col.id ? sortConfig.direction : "desc"
                      }
                      onClick={() => onSortChange(col.id as keyof PlayerAggregates)}
                      sx={{
                        fontSize: "var(--cs-typography-fontSize-xs)",
                        fontWeight: 800,
                        "& .MuiTableSortLabel-icon": { opacity: 0.5 },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStatsGridData.map((row) => (
                <PlayerStatRow
                  key={row.playerId}
                  row={row}
                  jersey={jerseyMap.get(row.playerId) || "??"}
                  isOnCourt={draftOnCourtIds.has(row.playerId)}
                />
              ))}
            </TableBody>
          </Table>
        </Box>
      </MoleskineCard>
    </Box>
  );
};

const PlayerStatRow = ({
  row,
  jersey,
  isOnCourt,
}: {
  row: PlayerAggregates;
  jersey: string;
  isOnCourt: boolean;
}) => (
  <TableRow
    sx={{
      backgroundColor: isOnCourt ? "var(--cs-semantic-color-bg-subtle)" : "transparent",
      "&:hover": { backgroundColor: "var(--cs-semantic-color-bg-emphasis)" },
    }}
  >
    <TableCell sx={{ py: 1 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 900,
          color: isOnCourt ? "primary.main" : "text.secondary",
        }}
      >
        {jersey}
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <StatValue value={row.points} bold />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <Typography variant="body2" sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}>
        {Math.round(row.fgPct)}%
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <StatValue value={row.assists} />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <StatValue value={row.rebounds} />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          color: row.efficiency >= 15 ? "success.main" : "text.primary",
        }}
      >
        {row.efficiency}
      </Typography>
    </TableCell>
  </TableRow>
);
