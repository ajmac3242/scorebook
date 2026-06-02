import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { OnOffStats } from "../../utils/stats/impact";
import { formatPlusMinus } from "../../utils/mathUtils";

interface OnOffImpactTableProps {
  data: OnOffStats[];
}

export const OnOffImpactTable: React.FC<OnOffImpactTableProps> = ({ data }) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell rowSpan={2} sx={{ fontWeight: 800 }}>
              PLAYER
            </TableCell>
            <TableCell
              colSpan={3}
              align="center"
              sx={{
                bgcolor: "var(--cs-semantic-color-feedback-success-light)",
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-feedback-success-dark)",
              }}
            >
              TEAM ON
            </TableCell>
            <TableCell
              colSpan={3}
              align="center"
              sx={{
                bgcolor: "var(--cs-semantic-color-feedback-error-light)",
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-feedback-error-dark)",
              }}
            >
              TEAM OFF
            </TableCell>
            <TableCell rowSpan={2} align="center" sx={{ fontWeight: 800 }}>
              DIFF
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              OFF RTG
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              DEF RTG
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              NET RTG
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              OFF RTG
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              DEF RTG
            </TableCell>
            <TableCell
              align="center"
              sx={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              NET RTG
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.playerId}>
              <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
              <TableCell align="center">{row.on.offRating}</TableCell>
              <TableCell align="center">{row.on.defRating}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color:
                    parseFloat(row.on.netRating) >= 0
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : "var(--cs-semantic-color-feedback-error-main)",
                }}
              >
                {formatPlusMinus(parseFloat(row.on.netRating))}
              </TableCell>
              <TableCell align="center">{row.off.offRating}</TableCell>
              <TableCell align="center">{row.off.defRating}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color:
                    parseFloat(row.off.netRating) >= 0
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : "var(--cs-semantic-color-feedback-error-main)",
                }}
              >
                {formatPlusMinus(parseFloat(row.off.netRating))}
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 900,
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  color:
                    parseFloat(row.differential) >= 0
                      ? "var(--cs-semantic-color-feedback-success-main)"
                      : "var(--cs-semantic-color-feedback-error-main)",
                }}
              >
                {formatPlusMinus(parseFloat(row.differential))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
