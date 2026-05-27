import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface DefensiveIntegrityRow {
  reason: string;
  frequency: number;
  points: number;
  percentage: string;
}

interface DefensiveIntegrityDialogProps {
  open: boolean;
  onClose: () => void;
  defensiveIntegrity: DefensiveIntegrityRow[];
}

export const DefensiveIntegrityDialog = ({
  open,
  onClose,
  defensiveIntegrity,
}: DefensiveIntegrityDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle
      sx={{
        fontFamily: "var(--cs-typography-fontFamily-display)",
        fontWeight: "var(--cs-typography-fontWeight-bold)",
      }}
    >
      Defensive Integrity Report
    </DialogTitle>
    <DialogContent>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: "var(--cs-semantic-spacing-md)" }}
      >
        Breakdown of points allowed by tactic — identify your most frequent
        defensive &quot;weak links.&quot;
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {["REASON", "FREQ", "PTS", "% OF TOTAL"].map((h) => (
                <TableCell
                  key={h}
                  align={h === "REASON" ? "left" : "right"}
                  sx={{ fontWeight: 800 }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {defensiveIntegrity.map((row) => (
              <TableRow key={row.reason}>
                <TableCell sx={{ fontWeight: 600 }}>{row.reason}</TableCell>
                <TableCell align="right">{row.frequency}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: "var(--cs-typography-fontWeight-bold)" }}
                >
                  {row.points}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: "var(--cs-typography-fontWeight-black)",
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
