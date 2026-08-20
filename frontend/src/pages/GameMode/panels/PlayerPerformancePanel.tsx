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
import { SurfaceCard } from "../../../components/cards/SurfaceCard";
import KpiStat from "../../../components/data-display/KpiStat";
import PlaybookEfficiencyWidget from "../../../components/game/PlaybookEfficiencyWidget";
import { useTokens } from "../../../theme/useTokens";

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
  onChainPromptDismiss?: () => void;
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
  const tokens = useTokens();

  return (
    <Box sx={{ mb: tokens.semantic.spacing.md / 8 }}>
      {chainPrompt && !isReadOnly && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            mb: tokens.semantic.spacing.sm / 8,
            backgroundColor: tokens.semantic.color.feedback.info.light,
            border: `1px solid ${tokens.semantic.color.feedback.info.main}`,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: tokens.typography.fontWeight.black }}
          >
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
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            mb: tokens.semantic.spacing.xs / 8,
            display: "block",
            color: tokens.semantic.color.text.secondary,
          }}
        >
          Player Performance
        </Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small" aria-label="Player stats">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: tokens.typography.fontWeight.black,
                    py: tokens.semantic.spacing.xs / 8,
                  }}
                >
                  #
                </TableCell>
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
                      py: tokens.semantic.spacing.xs / 8,
                      borderLeft: `1px solid ${tokens.semantic.color.border.subtle}`,
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
                        fontSize: tokens.typography.fontSize.xs,
                        fontWeight: tokens.typography.fontWeight.black,
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
                  jersey={jerseyMap.get(row.id.toString()) ?? "??"}
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
}) => {
  const tokens = useTokens();

  return (
    <TableRow
      sx={{
        backgroundColor: isOnCourt
          ? tokens.semantic.color.surface.subtle
          : "transparent",
        "&:hover": { backgroundColor: tokens.semantic.color.action.hover },
      }}
    >
      <TableCell sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: tokens.typography.fontWeight.black,
            color: isOnCourt
              ? tokens.semantic.color.brand.primary.main
              : tokens.semantic.color.text.secondary,
          }}
        >
          {jersey}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          {row.name}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <KpiStat label="PTS" value={row.points} size="sm" />
      </TableCell>
      <TableCell align="right" sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: tokens.typography.fontSize.xs }}
        >
          {Math.round(parseFloat(row.fgPct))}%
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <KpiStat label="AST" value={row.assists} size="sm" />
      </TableCell>
      <TableCell align="right" sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <KpiStat label="REB" value={row.rebounds} size="sm" />
      </TableCell>
      <TableCell align="right" sx={{ py: tokens.semantic.spacing.xs / 8 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: tokens.typography.fontWeight.black,
            color:
              row.fouls >= 4
                ? tokens.semantic.color.feedback.error.main
                : tokens.semantic.color.text.primary,
          }}
        >
          {row.fouls}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
