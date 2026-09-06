/**
 * @file CourtMarkerFilters.tsx
 * @description Chip row for filtering shot/stat markers displayed on the court.
 */
import React from "react";
import { Stack, Chip } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

const FILTER_TYPES = [
  "ALL",
  "MAKE",
  "MISS",
  "REBOUND",
  "ASSIST",
  "STEAL",
  "BLOCK",
] as const;
export type MarkerFilter = (typeof FILTER_TYPES)[number];

interface CourtMarkerFiltersProps {
  markerFilter: MarkerFilter;
  onFilterChange: (_filter: MarkerFilter) => void;
}

export const CourtMarkerFilters: React.FC<CourtMarkerFiltersProps> = React.memo(
  ({ markerFilter, onFilterChange }) => {
    const tokens = useTokens();
    return (
      <Stack
        direction="row"
        spacing={tokens.semantic.spacing.xs / 8}
        useFlexGap
        sx={{ flexWrap: "wrap" }}
        aria-label="Filter court markers by action type"
      >
        {FILTER_TYPES.map((type) => (
          <Chip
            key={type}
            label={type}
            onClick={() => onFilterChange(type)}
            variant={markerFilter === type ? "filled" : "outlined"}
            size="small"
            color={markerFilter === type ? "primary" : "default"}
            aria-pressed={markerFilter === type}
            aria-label={`Filter court markers by ${type}`}
          />
        ))}
      </Stack>
    );
  },
);

CourtMarkerFilters.displayName = "CourtMarkerFilters";
