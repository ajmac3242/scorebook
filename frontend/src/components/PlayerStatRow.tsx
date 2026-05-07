import React from "react";
import { TableRow, TableCell, Avatar, Typography } from "@mui/material";

interface PlayerStatRowProps {
  row?: any;
  [key: string]: any;
}

export const PlayerStatRow: React.FC<PlayerStatRowProps> = (props) => {
  const { row, ...rest } = props;

  // If row is passed, use it (GameStats.tsx style)
  if (row) {
    return (
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
    );
  }

  // Otherwise use flat props (GameMode.tsx style)
  const {
    jerseyNumber,
    name,
    avatarColor,
    min,
    points,
    makes,
    attempts,
    fgPct,
    efgPct,
    offRebounds,
    defRebounds,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    plusMinus,
  } = rest;

  return (
    <TableRow>
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
            bgcolor: avatarColor,
          }}
        >
          {jerseyNumber}
        </Avatar>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          {name}
        </Typography>
      </TableCell>
      <TableCell align="right">{min}</TableCell>
      <TableCell align="right">{points}</TableCell>
      <TableCell align="right">
        {makes}-{attempts}
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {fgPct}%
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {efgPct}%
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {offRebounds}
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {defRebounds}
      </TableCell>
      <TableCell align="right">{rebounds}</TableCell>
      <TableCell align="right">{assists}</TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {steals}
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {blocks}
      </TableCell>
      <TableCell
        align="right"
        sx={{ display: { xs: "none", sm: "table-cell" } }}
      >
        {turnovers}
      </TableCell>
      <TableCell align="right">{fouls}</TableCell>
      <TableCell align="right">
        {plusMinus > 0 ? `+${plusMinus}` : plusMinus}
      </TableCell>
    </TableRow>
  );
};

export default PlayerStatRow;
