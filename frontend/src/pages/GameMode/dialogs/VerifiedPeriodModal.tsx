import React, { useState, useMemo } from "react";
import { useTokens } from "../../../theme/useTokens";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { Player } from "../../../db";

/**
 * @file VerifiedPeriodModal.tsx
 * @description Mandatory modal for reconciling app stats with official table at period ends.
 */

interface VerifiedPeriodModalProps {
  open: boolean;
  onClose: () => void;
  period: number;
  periodLabel: string;
  appScore: { team: number; opp: number };
  appFouls: { team: number; opp: number };
  teamPeriodPlayerFouls: Map<string, number>;
  players: Player[];
  jerseyMap: Map<string, string | undefined>;
  onVerify: (_adjustments: {
    teamScore: number;
    oppScore: number;
    teamFouls: number;
    oppFouls: number;
    playerFoulAdjustments: Record<string, number>;
  }) => void;
}

export const VerifiedPeriodModal: React.FC<VerifiedPeriodModalProps> = ({
  open,
  onClose,
  period,
  periodLabel,
  appScore,
  appFouls,
  teamPeriodPlayerFouls = new Map(),
  players = [],
  jerseyMap = new Map(),
  onVerify,
}) => {
  const tokens = useTokens();
  const [officialTeamScore, setOfficialTeamScore] = useState(
    appScore.team.toString(),
  );
  const [officialOppScore, setOfficialOppScore] = useState(
    appScore.opp.toString(),
  );
  const [officialTeamFouls, setOfficialTeamFouls] = useState(
    appFouls.team.toString(),
  );
  const [officialOppFouls, setOfficialOppFouls] = useState(
    appFouls.opp.toString(),
  );

  const [playerFoulAdjustments, setPlayerFoulAdjustments] = useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    if (teamPeriodPlayerFouls) {
      teamPeriodPlayerFouls.forEach((count, pId) => {
        initial[pId] = count;
      });
    }
    return initial;
  });

  const handleAdjustPlayerFoul = (playerId: string, delta: number) => {
    setPlayerFoulAdjustments((prev) => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + delta),
    }));

    // Auto-calculate official team fouls from individual adjustments to be helpful
    setOfficialTeamFouls((prev) =>
      Math.max(0, (parseInt(prev) || 0) + delta).toString(),
    );
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const jA = parseInt(jerseyMap.get(a.id?.toString() || "") || "0");
      const jB = parseInt(jerseyMap.get(b.id?.toString() || "") || "0");
      return jA - jB;
    });
  }, [players, jerseyMap]);

  const handleConfirm = () => {
    // Calculate adjustments (diff from original)
    const adjustments: Record<string, number> = {};
    Object.keys(playerFoulAdjustments).forEach((pId) => {
      const original = teamPeriodPlayerFouls?.get(pId) || 0;
      const current = playerFoulAdjustments[pId];
      if (current !== original) {
        adjustments[pId] = current - original;
      }
    });

    onVerify({
      teamScore: parseInt(officialTeamScore) || 0,
      oppScore: parseInt(officialOppScore) || 0,
      teamFouls: parseInt(officialTeamFouls) || 0,
      oppFouls: parseInt(officialOppFouls) || 0,
      playerFoulAdjustments: adjustments,
    });
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      aria-labelledby="verified-period-modal-title"
      onClose={(_, reason) => {
        if (reason !== "escapeKeyDown") onClose();
      }}
    >
      <DialogTitle id="verified-period-modal-title" sx={{ textAlign: "center" }}>
        Verify {periodLabel} {period} Totals
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Typography
          variant="body2"
          sx={{
            mb: tokens.semantic.spacing.lg / 8,
            textAlign: "center",
            color: tokens.semantic.color.text.secondary,
          }}
        >
          Please reconcile app totals with the official scorekeeper's table.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: tokens.semantic.spacing.lg / 8,
            mb: tokens.semantic.spacing.lg / 8,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                mb: tokens.semantic.spacing.sm / 8,
                display: "block",
                color: tokens.semantic.color.brand.primary.main,
              }}
            >
              Our Team
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: tokens.semantic.spacing.md / 8,
              }}
            >
              <TextField
                label="Official Score"
                type="number"
                value={officialTeamScore}
                onChange={(e) => setOfficialTeamScore(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appScore.team}`}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: `${tokens.semantic.component.radius.input}px`,
                    },
                  },
                }}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialTeamFouls}
                onChange={(e) => setOfficialTeamFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.team}`}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: `${tokens.semantic.component.radius.input}px`,
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                mb: tokens.semantic.spacing.sm / 8,
                display: "block",
                color: tokens.semantic.color.brand.secondary.main,
              }}
            >
              Opponent
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: tokens.semantic.spacing.md / 8,
              }}
            >
              <TextField
                label="Official Score"
                type="number"
                value={officialOppScore}
                onChange={(e) => setOfficialOppScore(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appScore.opp}`}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: `${tokens.semantic.component.radius.input}px`,
                    },
                  },
                }}
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialOppFouls}
                onChange={(e) => setOfficialOppFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.opp}`}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: `${tokens.semantic.component.radius.input}px`,
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: tokens.semantic.spacing.md / 8 }} />

        <Typography
          variant="subtitle2"
          sx={{
            mb: tokens.semantic.spacing.sm / 8,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.semantic.color.text.primary,
          }}
        >
          Individual Player Fouls
        </Typography>

        {sortedPlayers.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontStyle: "italic",
              color: tokens.semantic.color.text.secondary,
              mb: tokens.semantic.spacing.md / 8,
            }}
          >
            No players available.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: tokens.semantic.spacing.verifiedModalListHeight,
              overflowY: "auto",
              mb: tokens.semantic.spacing.md / 8,
              pr: 1,
            }}
          >
            {sortedPlayers.map((player) => {
              const pId = player.id?.toString() || "";
              const count = playerFoulAdjustments[pId] || 0;
              const jersey = jerseyMap.get(pId) || "??";
              return (
                <Box
                  key={pId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom:
                      "1px solid var(--cs-semantic-color-border-subtle)",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    #{jersey} {player.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Tooltip title="Decrease foul count">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustPlayerFoul(pId, -1)}
                          disabled={count === 0}
                          color="primary"
                          aria-label="Decrease foul count"
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 20,
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </Typography>
                    <Tooltip title="Increase foul count">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustPlayerFoul(pId, 1)}
                          color="primary"
                          aria-label="Increase foul count"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            p: tokens.semantic.spacing.md / 8,
            bgcolor: tokens.semantic.color.surface.subtle,
            border: `1px solid ${tokens.semantic.color.border.subtle}`,
            borderRadius: `${tokens.semantic.shape.radius.md}px`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontStyle: "italic",
              color: tokens.semantic.color.text.secondary,
              display: "block",
            }}
          >
            Discrepancies will be corrected via SYSTEM_ADJUSTMENT events.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={handleConfirm}
          sx={{
            py: 1.5,
            fontWeight: tokens.typography.fontWeight.bold,
          }}
        >
          Verify & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
