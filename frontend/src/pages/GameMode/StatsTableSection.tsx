import React from "react";
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
} from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";
import { PlayerStatRow } from "../../components/PlayerStatRow";
import { PlayerAggregates } from "../../utils/stats";

interface StatsTableSectionProps {
  sortedStatsGridData: PlayerAggregates[];
  sortConfig: { key: keyof PlayerAggregates; direction: "asc" | "desc" };
  setSortConfig: (_config: {
    key: keyof PlayerAggregates;
    direction: "asc" | "desc";
  }) => void;
  playerStreaks: Map<string, "HOT" | "COLD" | null | undefined>;
}

export const StatsTableSection: React.FC<StatsTableSectionProps> = ({
  sortedStatsGridData,
  sortConfig,
  setSortConfig,
  playerStreaks,
}) => {
  return (
    <MoleskineCard>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Player Performance
      </Typography>
      <TableContainer>
        <Table size="small">
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
                      sortConfig.key === head.key ? sortConfig.direction : "asc"
                    }
                    onClick={() =>
                      setSortConfig({
                        key: head.key as keyof PlayerAggregates,
                        direction:
                          sortConfig.key === head.key &&
                          sortConfig.direction === "asc"
                            ? "desc"
                            : "asc",
                      })
                    }
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
                streak={playerStreaks.get(row.id.toString())}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MoleskineCard>
  );
};
