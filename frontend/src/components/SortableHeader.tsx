import React from "react";
import { TableCell, Tooltip } from "@mui/material";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
  sortConfig: { key: string; direction: "asc" | "desc" };
  onSort: (_key: string) => void;
  tooltip?: string;
}

/**
 * Helper component for sortable table headers.
 */
const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  align = "right",
  hideOnMobile = false,
  sortConfig,
  onSort,
  tooltip,
}) => {
  const content = (
    <TableCell
      align={align}
      onClick={() => onSort(sortKey)}
      sx={{
        cursor: "pointer",
        fontWeight: 700,
        "&:hover": { color: "primary.main" },
        whiteSpace: "nowrap",
        display: hideOnMobile ? { xs: "none", sm: "table-cell" } : "table-cell",
      }}>
      {label}{" "}
      {sortConfig.key === sortKey &&
        (sortConfig.direction === "asc" ? "↑" : "↓")}
    </TableCell>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="top" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default SortableHeader;
