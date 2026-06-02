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
        fontWeight: "var(--cs-typography-fontWeight-bold)",
        color: "var(--cs-semantic-color-text-secondary)",
        transition:
          "all var(--cs-motion-duration-fast) var(--cs-motion-easing-productive)",
        "&:hover": {
          color: "var(--cs-semantic-color-brand-primary-main)",
          bgcolor: "var(--cs-semantic-color-action-hover)",
        },
        whiteSpace: "nowrap",
        display: hideOnMobile ? { xs: "none", sm: "table-cell" } : "table-cell",
        borderBottom: "2px solid var(--cs-semantic-color-border-subtle)",
      }}
    >
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
