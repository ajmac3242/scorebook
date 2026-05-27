import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { OpenInFull as ExpandIcon } from "@mui/icons-material";

type ExpandedSectionType =
  | "boxScore"
  | "shotChart"
  | "scoreFlow"
  | "lineups"
  | null;

interface ExpandedSectionDialogProps {
  expandedSection: ExpandedSectionType;
  onClose: () => void;
  boxScoreTable: React.ReactNode;
  shotChartFilters: React.ReactNode;
  shotChartCourt: React.ReactNode;
  scoreFlowChart: React.ReactNode;
  lineupTable: React.ReactNode;
}

export const ExpandedSectionDialog = ({
  expandedSection,
  onClose,
  boxScoreTable,
  shotChartFilters,
  shotChartCourt,
  scoreFlowChart,
  lineupTable,
}: ExpandedSectionDialogProps) => (
  <Dialog
    fullWidth
    maxWidth="lg"
    open={expandedSection !== null}
    onClose={onClose}
  >
    <DialogTitle
      sx={{
        fontFamily: "var(--cs-typography-fontFamily-display)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {expandedSection === "boxScore" && "Box Score"}
      {expandedSection === "shotChart" && "Shot Chart"}
      {expandedSection === "scoreFlow" && "Score Flow"}
      {expandedSection === "lineups" && "Lineup Efficiency"}
      <IconButton onClick={onClose} aria-label="Collapse section">
        <ExpandIcon sx={{ transform: "rotate(180deg)" }} />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      {expandedSection === "boxScore" && boxScoreTable}
      {expandedSection === "shotChart" && (
        <>
          {shotChartFilters}
          <Box sx={{ p: 1, maxWidth: 800, mx: "auto" }}>{shotChartCourt}</Box>
        </>
      )}
      {expandedSection === "scoreFlow" && (
        <Box sx={{ height: 500 }}>{scoreFlowChart}</Box>
      )}
      {expandedSection === "lineups" && lineupTable}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
