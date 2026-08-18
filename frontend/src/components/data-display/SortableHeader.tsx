import React from "react";
import { TableCell, Tooltip } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

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
  const tokens = useTokens();

  const content = (
    <TableCell
      align={align}
      onClick={() => onSort(sortKey)}
      sx={{
        cursor: "pointer",
        fontWeight: tokens.typography.fontWeight.bold,
        color: tokens.semantic.color.text.secondary,
        transition:
          `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
        "&:hover": {
          color: tokens.semantic.color.brand.primary.main,
          bgcolor: tokens.semantic.color.action.hover,
        },
        whiteSpace: "nowrap",
        display: hideOnMobile ? { xs: "none", sm: "table-cell" } : "table-cell",
        borderBottom: `2px solid ${tokens.semantic.color.border.subtle}`,
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
