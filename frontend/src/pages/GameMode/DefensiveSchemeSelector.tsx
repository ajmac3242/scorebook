/**
 * @file DefensiveSchemeSelector.tsx
 * @description Toggle button group for selecting the active defensive scheme.
 * Persists selection to IndexedDB and triggers a sync.
 */
import React from "react";
import { Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { SurfaceCard } from "../../components/cards/SurfaceCard";
import { db } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";

const SCHEMES = ["MAN", "ZONE", "PRESS", "DOUBLE"] as const;
export type DefensiveScheme = (typeof SCHEMES)[number];

interface DefensiveSchemeSelectorProps {
  activeScheme: string | undefined;
  gameId: string | null;
  isReadOnly: boolean;
}

export const DefensiveSchemeSelector: React.FC<DefensiveSchemeSelectorProps> =
  React.memo(({ activeScheme, gameId, isReadOnly }) => {
    const handleChange = async (_e: React.MouseEvent, val: string | null) => {
      if (!val || !gameId) return;
      try {
        await db.games.update(gameId, {
          activeDefensiveScheme: val as DefensiveScheme,
          synced: 0,
        });
        await syncService.pushUpdates();
      } catch (err) {
        logger.error("Failed to update defensive scheme:", err);
      }
    };

    return (
      <SurfaceCard aria-label="Active Defensive Scheme">
        <Typography
          variant="overline"
          sx={{ fontWeight: 700, display: "block", mb: 1 }}
        >
          ACTIVE DEFENSIVE SCHEME
        </Typography>
        <ToggleButtonGroup
          value={activeScheme}
          exclusive
          onChange={handleChange}
          size="small"
          fullWidth
          disabled={isReadOnly}
          aria-disabled={isReadOnly || undefined}
          aria-label="Defensive scheme selection"
        >
          {SCHEMES.map((scheme) => (
            <ToggleButton key={scheme} value={scheme} aria-label={scheme}>
              {scheme}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </SurfaceCard>
    );
  });

DefensiveSchemeSelector.displayName = "DefensiveSchemeSelector";
