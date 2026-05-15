import React from "react";
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Avatar,
  Typography,
} from "@mui/material";
import SortableHeader from "../../components/SortableHeader";
import {
  type PlayerAggregates,
  type OpponentAggregates,
} from "../../utils/stats";

/**
 * @file BoxScoreSection.tsx
 * @description Extracted Box Score table component for GameStats page.
 */

interface BoxScoreSectionProps {
  playerAggregates: PlayerAggregates[];
  teamData: { ppp: string; points: number };
  oppData: OpponentAggregates;
  sortConfig: { key: string; direction: "asc" | "desc" };
  handleSort: (_key: string) => void;
}

export const BoxScoreSection: React.FC<BoxScoreSectionProps> = React.memo(
  ({ playerAggregates, teamData, oppData, sortConfig, handleSort }) => {
    return (
      <TableContainer
        sx={{
          mx: { xs: -2, sm: 0 },
          width: { xs: "calc(100% + 32px)", sm: "100%" },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
              <SortableHeader
                label="PLAYER"
                sortKey="name"
                align="left"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableHeader
                label="MIN"
                sortKey="min"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Minutes Played"
              />
              <SortableHeader
                label="PTS"
                sortKey="points"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Points"
              />
              <SortableHeader
                label="FG"
                sortKey="makes"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Field Goals Made-Attempted"
              />
              <SortableHeader
                label="FG%"
                sortKey="fgPct"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Field Goal Percentage"
              />
              <SortableHeader
                label="eFG%"
                sortKey="efgPct"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Effective Field Goal Percentage"
              />
              <SortableHeader
                label="OREB"
                sortKey="offRebounds"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Offensive Rebounds"
              />
              <SortableHeader
                label="DREB"
                sortKey="defRebounds"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Defensive Rebounds"
              />
              <SortableHeader
                label="REB"
                sortKey="rebounds"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Total Rebounds"
              />
              <SortableHeader
                label="AST"
                sortKey="assists"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Assists"
              />
              <SortableHeader
                label="HA"
                sortKey="hockeyAssists"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Hockey Assists (Secondary Assists)"
              />
              <SortableHeader
                label="STL"
                sortKey="steals"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Steals"
              />
              <SortableHeader
                label="BLK"
                sortKey="blocks"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Blocks"
              />
              <SortableHeader
                label="TO"
                sortKey="turnovers"
                hideOnMobile
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Turnovers"
              />
              <SortableHeader
                label="PF"
                sortKey="fouls"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Personal Fouls"
              />
              <SortableHeader
                label="+/-"
                sortKey="plusMinus"
                sortConfig={sortConfig}
                onSort={handleSort}
                tooltip="Plus/Minus"
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {playerAggregates.map((row) => (
              <TableRow key={row.id}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      fontSize: "0.75rem",
                      bgcolor: row.avatarColor,
                    }}
                  >
                    {row.jerseyNumber}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell align="right">{row.min}</TableCell>
                <TableCell align="right">{row.points}</TableCell>
                <TableCell align="right">
                  {row.makes}-{row.attempts}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.fgPct}%
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.efgPct}%
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.offRebounds}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.defRebounds}
                </TableCell>
                <TableCell align="right">{row.rebounds}</TableCell>
                <TableCell align="right">{row.assists}</TableCell>
                <TableCell align="right">{row.hockeyAssists}</TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.steals}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.blocks}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  {row.turnovers}
                </TableCell>
                <TableCell align="right">{row.fouls}</TableCell>
                <TableCell align="right">
                  {row.plusMinus > 0 ? `+${row.plusMinus}` : row.plusMinus}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}
            >
              <TableCell sx={{ fontWeight: 700 }}>
                TEAM TOTALS (PPP: {teamData.ppp})
              </TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {teamData.points}
              </TableCell>
              <TableCell align="right" colSpan={12}>
                -
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "secondary.light" }}>
              <TableCell sx={{ fontWeight: 700 }}>
                OPPONENT (PPP: {oppData.ppp})
              </TableCell>
              <TableCell align="right">-</TableCell>
              <TableCell align="right">{oppData.points}</TableCell>
              <TableCell align="right">
                {oppData.makes}-{oppData.attempts}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.fgPct}%
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                -
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.offRebounds}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.defRebounds}
              </TableCell>
              <TableCell align="right">{oppData.rebounds}</TableCell>
              <TableCell align="right">{oppData.assists}</TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.steals}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.blocks}
              </TableCell>
              <TableCell
                align="right"
                sx={{ display: { xs: "none", sm: "table-cell" } }}
              >
                {oppData.turnovers}
              </TableCell>
              <TableCell align="right">{oppData.fouls}</TableCell>
              <TableCell align="right">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
);
