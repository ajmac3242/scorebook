import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { type StatEvent, type Game } from "../../../db";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { EmptyState } from "../../../components/feedback";
import { useTokens } from "../../../theme/useTokens";

type PlayerActionLogCardProps = {
  filteredEvents: StatEvent[];
  games: Game[];
};

export const PlayerActionLogCard: React.FC<PlayerActionLogCardProps> = ({
  filteredEvents,
  games,
}) => {
  const tokens = useTokens();

  return (
    <PageSectionCard sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          px: tokens.semantic.spacing.md / 8,
          py: tokens.semantic.spacing.sm / 8,
          borderBottom: `1px solid ${tokens.semantic.color.border.subtle}`,
        }}
      >
        <Typography variant="h6">Action Log</Typography>
        <Typography
          variant="body2"
          sx={{ color: tokens.semantic.color.text.secondary }}
        >
          Detailed event history for the current player and filter set.
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small" aria-label="player action log">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Game</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Clock</TableCell>
              <TableCell align="right">X</TableCell>
              <TableCell align="right">Y</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: tokens.semantic.spacing.lg / 8 }}>
                    <EmptyState
                      icon={
                        <HistoryIcon sx={{ fontSize: tokens.spacing[8] / 8 }} />
                      }
                      title="No actions recorded"
                      description="No actions match the current filters."
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event, index) => {
                const game = games.find((g) => g.id === event.gameId);

                return (
                  <TableRow key={`${event.gameId}-${index}`}>
                    <TableCell>{event.type}</TableCell>
                    <TableCell>{game?.opponent || event.gameId}</TableCell>
                    <TableCell>{event.period || "-"}</TableCell>
                    <TableCell>{event.clockTime || "-"}</TableCell>
                    <TableCell align="right">
                      {event.locationX ?? "-"}
                    </TableCell>
                    <TableCell align="right">
                      {event.locationY ?? "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PageSectionCard>
  );
};

export default PlayerActionLogCard;
