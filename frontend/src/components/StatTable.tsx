import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

export type StatTableColumn<T> = {
  key: keyof T;
  label: string;
  align?: "left" | "right" | "center";
  format?: (value: T[keyof T], row: T) => React.ReactNode;
  color?: (value: T[keyof T], row: T) => string | undefined;
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
  const displayRows = maxRows ? rows.slice(0, maxRows) : rows;

  return (
    <Table size={size} sx={{ width: "100%" }}>
      <TableHead>
        <TableRow sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}>
          {columns.map((col) => (
            <TableCell
              key={String(col.key)}
              align={col.align ?? "left"}
              sx={{
                fontWeight: 700,
                fontSize: "var(--cs-typography-fontSize-xs)",
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: "text.secondary",
                py: 1,
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
            <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          displayRows.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                "&:nth-of-type(odd)": { bgcolor: "background.paper" },
                "&:nth-of-type(even)": {
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
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
                      fontSize: "var(--cs-typography-fontSize-sm)",
                      color: color ?? "text.primary",
                      fontWeight: color ? 700 : 400,
                      py: 1,
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
