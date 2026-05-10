import React from "react";
import {
  TableContainer,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import { SparkPlugIndex } from "../../utils/stats/types";

interface SparkPlugTableProps {
  sparkPlugIndex: SparkPlugIndex[];
  jerseyMap: Map<string, string | undefined>;
  playerNamesMap: Map<string, string>;
}

const SparkPlugTable: React.FC<SparkPlugTableProps> = ({
  sparkPlugIndex,
  jerseyMap,
  playerNamesMap,
}) => {
  return (
    <TableContainer sx={{ mt: 2, mb: 3 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          mb: 1,
          display: "block",
          textTransform: "uppercase",
          color: "primary.main",
        }}
      >
        SPARK PLUG MOMENTUM INDEX
      </Typography>
      <Table size="small" aria-label="Spark Plug Momentum Index">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: "0.6rem", fontWeight: 800 }}>
              PLAYER
            </TableCell>
            <TableCell align="center" sx={{ fontSize: "0.6rem", fontWeight: 800 }}>
              HUSTLE
            </TableCell>
            <TableCell align="center" sx={{ fontSize: "0.6rem", fontWeight: 800 }}>
              RUN PTS
            </TableCell>
            <TableCell align="center" sx={{ fontSize: "0.6rem", fontWeight: 800 }}>
              INDEX
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sparkPlugIndex.slice(0, 3).map((spi) => (
            <TableRow key={spi.playerId}>
              <TableCell sx={{ fontSize: "0.65rem", fontWeight: 700 }}>
                #{jerseyMap.get(spi.playerId)}{" "}
                {playerNamesMap.get(spi.playerId)?.split(" ")[0]}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                {spi.hustleStats}
              </TableCell>
              <TableCell align="center" sx={{ fontSize: "0.65rem" }}>
                {spi.momentumScore}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={spi.compositeIndex}
                  size="small"
                  color={spi.compositeIndex >= 10 ? "primary" : "default"}
                  sx={{
                    height: 18,
                    fontSize: "0.6rem",
                    fontWeight: 800,
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default React.memo(SparkPlugTable);
