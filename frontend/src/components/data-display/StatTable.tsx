import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTokens } from "../../theme/useTokens";

export type StatTableColumn<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right" | "center";
  format?: (_value: T[keyof T], _row: T) => React.ReactNode;
  color?: (_value: T[keyof T], _row: T) => string | undefined;
};

type StatTableProps<T> = {
  rows: T[];
  columns: StatTableColumn<T>[];
  emptyMessage?: string;
  maxRows?: number;
  size?: "small" | "medium";
};

function StatTable<T>({
  rows,
  columns,
  emptyMessage = "No data available.",
  maxRows,
  size = "small",
}: StatTableProps<T>) {
  const tokens = useTokens();
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows;

  return (
    <Table size={size} sx={{ width: "100%" }}>
      <TableHead>
        <TableRow sx={{ bgcolor: tokens.semantic.color.surface.subtle }}>
          {columns.map((col) => (
            <TableCell
              key={String(col.key)}
              align={col.align ?? "left"}
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                fontSize: tokens.typography.fontSize.xs,
                letterSpacing: tokens.typography.letterSpacing.wider,
                textTransform: "uppercase",
                color: tokens.semantic.color.text.secondary,
                py: tokens.spacing[1] / 8,
              }}
            >
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {displayRows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              align="center"
              sx={{ py: tokens.spacing[3] / 8 }}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          displayRows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                "&:nth-of-type(odd)": {
                  bgcolor: tokens.semantic.color.background.paper,
                },
                "&:nth-of-type(even)": {
                  bgcolor: tokens.semantic.color.surface.subtle,
                },
              }}
            >
              {columns.map((col) => {
                const value = row[col.key];
                const color = col.color?.(value, row);
                return (
                  <TableCell
                    key={String(col.key)}
                    align={col.align ?? "left"}
                    sx={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: color ?? tokens.semantic.color.text.primary,
                      fontWeight: color ? tokens.typography.fontWeight.bold : 400,
                      py: tokens.spacing[1] / 8,
                    }}
                  >
                    {col.format ? col.format(value, row) : String(value ?? "—")}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default StatTable;
