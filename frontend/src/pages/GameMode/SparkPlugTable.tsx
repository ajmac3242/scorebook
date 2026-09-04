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
import { SurfaceCard } from "../../components/cards/SurfaceCard";
import { useTokens } from "../../theme/useTokens";

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
    const tokens = useTokens();
    const topThree = sparkPlugIndex.slice(0, 3);

    return (
      <SurfaceCard aria-label="Spark Plug Momentum Index">
        <Typography
          variant="overline"
          sx={{
            fontWeight: tokens.typography.fontWeight.bold,
            display: "block",
            mb: tokens.semantic.spacing.xs / 8,
            color: tokens.semantic.color.text.secondary,
          }}
        >
          SPARK PLUG MOMENTUM INDEX
        </Typography>
        {topThree.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: tokens.semantic.color.text.secondary }}
          >
            Collecting momentum data...
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Spark Plug table">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.xs,
                      py: tokens.semantic.spacing.xs / 16,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    PLAYER
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.xs,
                      py: tokens.semantic.spacing.xs / 16,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    HUSTLE
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.xs,
                      py: tokens.semantic.spacing.xs / 16,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    RUN
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.xs,
                      py: tokens.semantic.spacing.xs / 16,
                      color: tokens.semantic.color.text.secondary,
                    }}
                  >
                    INDEX
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topThree.map((spi) => {
                  const jersey = jerseyMap.get(spi.playerId) ?? "??";
                  const firstName =
                    playerNamesMap.get(spi.playerId)?.split(" ")[0] ?? "";

                  return (
                    <TableRow key={spi.playerId}>
                      <TableCell
                        sx={{
                          fontSize: tokens.typography.fontSize.xs,
                          py: tokens.semantic.spacing.xs / 16,
                        }}
                      >
                        #{jersey} {firstName}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: tokens.typography.fontSize.xs,
                          py: tokens.semantic.spacing.xs / 16,
                        }}
                      >
                        {spi.hustleStats}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: tokens.typography.fontSize.xs,
                          py: tokens.semantic.spacing.xs / 16,
                        }}
                      >
                        {spi.momentumScore}
                      </TableCell>
                      <TableCell sx={{ py: tokens.semantic.spacing.xs / 16 }}>
                        <Chip
                          label={spi.compositeIndex}
                          color={
                            spi.compositeIndex >= 10 ? "primary" : "default"
                          }
                          aria-label={`Momentum index for #${jersey} ${firstName}: ${spi.compositeIndex}`}
                          sx={{
                            height: 18,
                            fontSize: tokens.typography.fontSize.xs,
                            fontWeight: tokens.typography.fontWeight.bold,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SurfaceCard>
    );
  },
);

SparkPlugTable.displayName = "SparkPlugTable";
