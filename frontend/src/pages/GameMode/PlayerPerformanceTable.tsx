import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
} from "@mui/material";
import { PlayerAggregates } from "../../utils/stats/types";
import { PlayerStatRow } from "../../components/PlayerStatRow";

interface PlayerPerformanceTableProps {
  sortedStatsGridData: PlayerAggregates[];
  sortConfig: {
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  };
  onSort: (_key: keyof PlayerAggregates) => void;
  playerStreaks: Map<string, "HOT" | "COLD" | null>;
  onCourtIds: Set<string>;
}

const PlayerPerformanceTable: React.FC<PlayerPerformanceTableProps> = ({
  sortedStatsGridData,
  sortConfig,
  onSort,
  playerStreaks,
  onCourtIds,
}) => {
  return (
    <TableContainer>
      <Table size="small" aria-label="Player Performance">
        <TableHead>
          <TableRow>
            {[
              { label: "#", key: "jerseyNumber" },
              { label: "NAME", key: "name" },
              { label: "MIN", key: "min" },
              { label: "PTS", key: "points" },
              { label: "REB", key: "rebounds" },
              { label: "AST", key: "assists" },
              { label: "PF", key: "fouls" },
              { label: "+/-", key: "plusMinus" },
            ].map((head) => (
              <TableCell
                key={head.key}
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  px: 0.5,
                }}
              >
                <TableSortLabel
                  active={sortConfig.key === head.key}
                  direction={
                    sortConfig.key === head.key
                      ? sortConfig.direction
                      : "asc"
                  }
                  onClick={() => onSort(head.key as keyof PlayerAggregates)}
                >
                  {head.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedStatsGridData.map((row) => (
            <PlayerStatRow
              key={row.id}
              jerseyNumber={row.jerseyNumber?.toString() ?? ""}
              name={row.name}
              min={row.min}
              points={row.points}
              threePM={row.threePM}
              threePA={row.threePA}
              threePPct={row.threePPct}
              ftm={row.ftm}
              fta={row.fta}
              ftPct={row.ftPct}
              rebounds={row.rebounds}
              assists={row.assists}
              steals={row.steals}
              blocks={row.blocks}
              turnovers={row.turnovers}
              fouls={row.fouls}
              plusMinus={row.plusMinus}
              streak={playerStreaks.get(row.id!.toString())}
              isOnCourt={onCourtIds.has(row.id!.toString())}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(PlayerPerformanceTable);
