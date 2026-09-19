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
import { useTokens } from "../../theme/useTokens";

interface OnOffImpactTableProps {
  data: OnOffStats[];
}

export const OnOffImpactTable: React.FC<OnOffImpactTableProps> = ({ data }) => {
  const tokens = useTokens();

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="On-Off Impact Ratings">
        <TableHead>
          <TableRow>
            <TableCell
              component="th"
              scope="col"
              rowSpan={2}
              sx={{ fontWeight: tokens.typography.fontWeight.black }}
            >
              PLAYER
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              colSpan={3}
              align="center"
              sx={{
                bgcolor: tokens.semantic.color.feedback.success.light,
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.feedback.success.dark,
              }}
            >
              TEAM ON
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              colSpan={3}
              align="center"
              sx={{
                bgcolor: tokens.semantic.color.feedback.error.light,
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.feedback.error.dark,
              }}
            >
              TEAM OFF
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              rowSpan={2}
              align="center"
              sx={{ fontWeight: tokens.typography.fontWeight.black }}
            >
              DIFF
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              OFF RTG
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              DEF RTG
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              NET RTG
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              OFF RTG
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              DEF RTG
            </TableCell>
            <TableCell
              component="th"
              scope="col"
              align="center"
              sx={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.bold,
              }}
            >
              NET RTG
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.playerId}>
              <TableCell
                component="th"
                scope="row"
                sx={{ fontWeight: tokens.typography.fontWeight.semibold }}
              >
                {row.name}
              </TableCell>
              <TableCell align="center">{row.on.offRating}</TableCell>
              <TableCell align="center">{row.on.defRating}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color:
                    parseFloat(row.on.netRating) >= 0
                      ? tokens.semantic.color.feedback.success.main
                      : tokens.semantic.color.feedback.error.main,
                }}
              >
                {formatPlusMinus(parseFloat(row.on.netRating))}
              </TableCell>
              <TableCell align="center">{row.off.offRating}</TableCell>
              <TableCell align="center">{row.off.defRating}</TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: tokens.typography.fontWeight.bold,
                  color:
                    parseFloat(row.off.netRating) >= 0
                      ? tokens.semantic.color.feedback.success.main
                      : tokens.semantic.color.feedback.error.main,
                }}
              >
                {formatPlusMinus(parseFloat(row.off.netRating))}
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: tokens.typography.fontWeight.black,
                  bgcolor: tokens.semantic.color.surface.subtle,
                  color:
                    parseFloat(row.differential) >= 0
                      ? tokens.semantic.color.feedback.success.main
                      : tokens.semantic.color.feedback.error.main,
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
