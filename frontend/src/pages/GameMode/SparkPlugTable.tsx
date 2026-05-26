/**
 * @file SparkPlugTable.tsx
 * @description Spark Plug Momentum Index table — shows top 3 performers
 * ranked by hustle + momentum composite score.
 */
import React from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";

interface SparkPlugEntry {
  playerId: string;
  hustleStats: number;
  momentumScore: number;
  compositeIndex: number;
}

interface SparkPlugTableProps {
  sparkPlugIndex: SparkPlugEntry[];
  jerseyMap: Map<string, string>;
  playerNamesMap: Map<string, string>;
}

export const SparkPlugTable: React.FC<SparkPlugTableProps> = React.memo(
  ({ sparkPlugIndex, jerseyMap, playerNamesMap }) => {
    const topThree = sparkPlugIndex.slice(0, 3);

    return (
      <MoleskineCard aria-label="Spark Plug Momentum Index">
        <Typography
          variant="overline"
          sx={{ fontWeight: 700 , display: "block", mb: 1}}
        >
          SPARK PLUG MOMENTUM INDEX
        </Typography>
        {topThree.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            Collecting momentum data...
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Spark Plug table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: "0.65rem", py: 0.5 }}
                  >
                    PLAYER
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: "0.65rem", py: 0.5 }}
                  >
                    HUSTLE
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: "0.65rem", py: 0.5 }}
                  >
                    RUN
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, fontSize: "0.65rem", py: 0.5 }}
                  >
                    INDEX
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topThree.map((spi) => (
                  <TableRow key={spi.playerId}>
                    <TableCell sx={{ fontSize: "0.7rem", py: 0.5 }}>
                      #{jerseyMap.get(spi.playerId)}{" "}
                      {playerNamesMap.get(spi.playerId)?.split(" ")[0]}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.7rem", py: 0.5 }}>
                      {spi.hustleStats}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.7rem", py: 0.5 }}>
                      {spi.momentumScore}
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Chip
                        label={spi.compositeIndex}
                        color={spi.compositeIndex >= 10 ? "primary" : "default"}
                        sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </MoleskineCard>
    );
  },
);

SparkPlugTable.displayName = "SparkPlugTable";
