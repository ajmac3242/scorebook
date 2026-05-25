/**
 * @file CourtMarkerFilters.tsx
 * @description Chip row for filtering shot/stat markers displayed on the court.
 */
import React from "react";
import { Stack, Chip } from "@mui/material";

const FILTER_TYPES = ["ALL", "MAKE", "MISS", "REBOUND", "ASSIST", "STEAL", "BLOCK"] as const;
export type MarkerFilter = (typeof FILTER_TYPES)[number];

interface CourtMarkerFiltersProps {
  markerFilter: string;
  onFilterChange: (filter: string) => void;
}

export const CourtMarkerFilters: React.FC<CourtMarkerFiltersProps> = React.memo(
  ({ markerFilter, onFilterChange }) => (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {FILTER_TYPES.map((type) => (
        <Chip
          key={type}
          label={type}
          onClick={() => onFilterChange(type)}
          variant={markerFilter === type ? "filled" : "outlined"}
          size="small"
          color={markerFilter === type ? "primary" : "default"}
          aria-pressed={markerFilter === type}
        />
      ))}
    </Stack>
  ),
);

CourtMarkerFilters.displayName = "CourtMarkerFilters";
