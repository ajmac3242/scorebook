import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { type GameAggregates } from "../hooks/useGameAggregates";
import { useTokens } from "../../../theme/useTokens";

interface DefensiveIntegrityDialogProps {
  open: boolean;
  onClose: () => void;
  defensiveIntegrity: GameAggregates["defensiveIntegrity"];
}

export const DefensiveIntegrityDialog: React.FC<
  DefensiveIntegrityDialogProps
> = ({ open, onClose, defensiveIntegrity }) => {
  const tokens = useTokens();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="defensive-integrity-title"
    >
      <DialogTitle
        id="defensive-integrity-title"
        sx={{
          fontFamily: tokens.typography.fontFamily.display,
          fontWeight: tokens.typography.fontWeight.bold,
          fontSize: tokens.typography.fontSize.lg,
        }}
      >
        Defensive Integrity Report
      </DialogTitle>
      <DialogContent
        role="region"
        aria-label="Defensive integrity points allowed breakdown"
      >
        <Typography
          variant="body2"
          sx={{
            mb: `${tokens.semantic.spacing.md}px`,
            fontSize: tokens.typography.fontSize.sm,
            color: tokens.semantic.color.text.secondary,
          }}
        >
          Breakdown of points allowed by tactical error category. Use this to
          identify your most frequent defensive &ldquo;weak links.&rdquo;
        </Typography>
        <TableContainer>
          <Table aria-label="Defensive integrity breakdown table">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  REASON
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  FREQ
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  PTS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: tokens.typography.fontWeight.bold,
                    fontSize: tokens.typography.fontSize.xs,
                  }}
                >
                  % OF TOTAL
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {defensiveIntegrity.map((row) => (
                <TableRow key={row.reason}>
                  <TableCell
                    sx={{
                      fontWeight: tokens.typography.fontWeight.semibold,
                      fontSize: tokens.typography.fontSize.sm,
                    }}
                  >
                    {row.reason}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: tokens.typography.fontSize.sm }}
                  >
                    {row.frequency}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.bold,
                      fontSize: tokens.typography.fontSize.sm,
                    }}
                  >
                    {row.points}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.black,
                      fontSize: tokens.typography.fontSize.sm,
                      color:
                        parseFloat(row.percentage) > 30
                          ? tokens.semantic.color.feedback.error.main
                          : tokens.semantic.color.text.primary,
                    }}
                  >
                    {row.percentage}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          aria-label="Close defensive integrity report dialog"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
