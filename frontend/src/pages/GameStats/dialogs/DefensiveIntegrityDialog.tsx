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

interface DefensiveIntegrityDialogProps {
  open: boolean;
  onClose: () => void;
  defensiveIntegrity: GameAggregates["defensiveIntegrity"];
}

export const DefensiveIntegrityDialog: React.FC<
  DefensiveIntegrityDialogProps
> = ({ open, onClose, defensiveIntegrity }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          fontFamily: "var(--cs-typography-fontFamily-display)",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          fontSize: "var(--cs-typography-fontSize-lg)",
        }}
      >
        Defensive Integrity Report
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: "var(--cs-semantic-spacing-md)",
            fontSize: "var(--cs-typography-fontSize-sm)",
          }}
        >
          Breakdown of points allowed by tactical error category. Use this to
          identify your most frequent defensive "weak links."
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 800,
                    fontSize: "var(--cs-typography-fontSize-xs)",
                  }}
                >
                  REASON
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    fontSize: "var(--cs-typography-fontSize-xs)",
                  }}
                >
                  FREQ
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    fontSize: "var(--cs-typography-fontSize-xs)",
                  }}
                >
                  PTS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 800,
                    fontSize: "var(--cs-typography-fontSize-xs)",
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
                      fontWeight: 600,
                      fontSize: "var(--cs-typography-fontSize-sm)",
                    }}
                  >
                    {row.reason}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontSize: "var(--cs-typography-fontSize-sm)" }}
                  >
                    {row.frequency}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                      fontSize: "var(--cs-typography-fontSize-sm)",
                    }}
                  >
                    {row.points}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "var(--cs-typography-fontWeight-black)",
                      fontSize: "var(--cs-typography-fontSize-sm)",
                      color:
                        parseFloat(row.percentage) > 30
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "inherit",
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
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
