import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Typography,
} from "@mui/material";
import { MoleskineCard } from "../SharedUI";
import SortableHeader from "../SortableHeader";
import { STAT_ACRONYMS } from "../../constants/stats";
import { type PlayerAggregates } from "../../utils/stats";

/**
 * Memoized row component for the player statistics table.
 * WHY: Prevents re-rendering all rows when only one player's data or sorting changes.
 */
const StatRow: React.FC<{
  row: PlayerAggregates;
  teamId: string;
  navigate: (_url: string) => void;
  getInitials: (_name: string) => string;
}> = React.memo(({ row, teamId, navigate, getInitials }) => (
  <TableRow
    hover
    sx={{ cursor: "pointer" }}
    onClick={() => navigate(`/players/${row.id}?teamId=${teamId}`)}
  >
    <TableCell
      sx={{
        fontWeight: 700,
        display: { xs: "none", sm: "table-cell" },
      }}
    >
      {row.jerseyNumber ?? "-"}
    </TableCell>
    <TableCell>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar
          sx={{
            bgcolor: row.avatarColor || "grey.500",
            width: { xs: 24, sm: 40 },
            height: { xs: 24, sm: 40 },
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: { xs: "0.6rem", sm: "0.8rem" } }}
          >
            {getInitials(row.name)}
          </Typography>
        </Avatar>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.75rem", sm: "1rem" },
          }}
        >
          {row.name}
        </Typography>
      </Box>
    </TableCell>
    <TableCell
      align="center"
      sx={{ display: { xs: "none", sm: "table-cell" } }}
    >
      {row.gp}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.min}
    </TableCell>
    <TableCell
      align="right"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "0.75rem", sm: "0.875rem" },
      }}
    >
      {row.points}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePM}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePA}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.threePPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.fgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.efgPct}%
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.rebounds}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.assists}
    </TableCell>
    <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
      {row.steals}
    </TableCell>
    <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
      {row.turnovers}
    </TableCell>
    <TableCell
      align="right"
      sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
    >
      {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
    </TableCell>
  </TableRow>
));

interface PlayerStatsTableProps {
  playerStats: PlayerAggregates[];
  sortConfig: { key: string; direction: "asc" | "desc" };
  handleSort: (_key: string) => void;
  teamId: string;
  navigate: (_url: string) => void;
  getInitials: (_name: string) => string;
}

/**
 * PlayerStatsTable component for displaying aggregated team player statistics.
 * WHY: Extracted from TeamStats.tsx to improve maintainability and performance.
 */
export const PlayerStatsTable: React.FC<PlayerStatsTableProps> = ({
  playerStats,
  sortConfig,
  handleSort,
  teamId,
  navigate,
  getInitials,
}) => {
  return (
    <Box sx={{ mt: 3 }}>
      <TableContainer
        component={MoleskineCard}
        sx={{
          mx: { xs: -2, sm: 0 },
          width: { xs: \"calc(100% + 32px)\", sm: \"100%\" },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: \"rgba(0,0,0,0.02)\" }}>
              <SortableHeader
                label=\"#\"
                sortKey=\"jerseyNumber\"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader
                label=\"PLAYER\"
                sortKey=\"name\"
                align=\"left\"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader
                label=\"GP\"
                sortKey=\"gp\"
                align=\"center\"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Games Played\"
              />
              <SortableHeader
                label=\"MIN\"
                sortKey=\"min\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Minutes Played\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.POINTS}
                sortKey=\"points\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Points\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.THREE_POINTERS_MADE}
                sortKey=\"threePM\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"3-Pointers Made\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.THREE_POINTERS_ATTEMPTED}
                sortKey=\"threePA\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"3-Pointers Attempted\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.THREE_POINTER_PERCENTAGE}
                sortKey=\"threePPct\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"3-Pointer Percentage\"
              />
              <SortableHeader
                label=\"FG%\"
                sortKey=\"fgPct\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Field Goal Percentage\"
              />
              <SortableHeader
                label=\"eFG%\"
                sortKey=\"efgPct\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Effective Field Goal Percentage\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.REBOUNDS}
                sortKey=\"rebounds\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Rebounds\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.ASSISTS}
                sortKey=\"assists\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Assists\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.STEALS}
                sortKey=\"steals\"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Steals\"
              />
              <SortableHeader
                label={STAT_ACRONYMS.TURNOVERS}
                sortKey=\"turnovers\"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Turnovers\"
              />
              <SortableHeader
                label=\"+/-\"
                sortKey=\"plusMinus\"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip=\"Plus/Minus\"
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {playerStats.map((row) => (
              <StatRow
                key={row.id}
                row={row}
                teamId={teamId}
                navigate={navigate}
                getInitials={getInitials}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
