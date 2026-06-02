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
} from "@mui/material";
import { SurfaceCard } from "../../../components/SharedUI";
import KpiStat from "../../../components/data-display/KpiStat";
import PlaybookEfficiencyWidget from "../../../components/game/PlaybookEfficiencyWidget";

import type { SortConfig, ChainPrompt, PlaybookEfficiency } from "../types";
import type { PlayerAggregates } from "../../../utils/stats";
import type { StatEvent } from "../../../db";

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
  gameStats: StatEvent[];
};

export const PlayerPerformancePanel: React.FC<PlayerPerformancePanelProps> = ({
  sortedStatsGridData,
  sortConfig,
  onSortChange,
  jerseyMap,
  draftOnCourtIds,
  chainPrompt,
  playbookEfficiency,
  isReadOnly,
  gameStats,
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
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            WHO GOT THE {chainPrompt.type}?
          </Typography>
        </Alert>
      )}

      {playbookEfficiency && (
        <PlaybookEfficiencyWidget
          plays={[]}
          teamPpp={1.0}
          gameStats={gameStats}
        />
      )}

      <SurfaceCard aria-label="Player stats">
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, mb: 1, display: "block" }}
        >
          Player Performance
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" aria-label="Player stats">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, py: 1.5 }}>#</TableCell>
                {[
                  { id: "points", label: "PTS" },
                  { id: "fgPct", label: "FG%" },
                  { id: "assists", label: "AST" },
                  { id: "rebounds", label: "REB" },
                  { id: "fouls", label: "PF" },
                ].map((col) => (
                  <TableCell
                    key={col.id}
                    align="right"
                    sx={{
                      py: 1.5,
                      borderLeft:
                        "1px solid var(--cs-semantic-color-border-subtle)",
                    }}
                  >
                    <TableSortLabel
                      active={sortConfig.key === col.id}
                      direction={
                        sortConfig.key === col.id
                          ? sortConfig.direction
                          : "desc"
                      }
                      onClick={() =>
                        onSortChange(col.id as keyof PlayerAggregates)
                      }
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
                  key={row.id}
                  row={row}
                  jersey={jerseyMap.get(row.id.toString()) || "??"}
                  isOnCourt={draftOnCourtIds.has(row.id.toString())}
                />
              ))}
            </TableBody>
          </Table>
        </Box>
      </SurfaceCard>
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
      backgroundColor: isOnCourt
        ? "var(--cs-semantic-color-bg-subtle)"
        : "transparent",
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
      <Typography variant="caption" color="text.secondary">
        {row.name}
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <KpiStat label="PTS" value={row.points} size="sm" />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <Typography
        variant="body2"
        sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
      >
        {Math.round(parseFloat(row.fgPct))}%
      </Typography>
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <KpiStat label="AST" value={row.assists} size="sm" />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <KpiStat label="REB" value={row.rebounds} size="sm" />
    </TableCell>
    <TableCell align="right" sx={{ py: 1 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          color: row.fouls >= 4 ? "error.main" : "text.primary",
        }}
      >
        {row.fouls}
      </Typography>
    </TableCell>
  </TableRow>
);
