import React, { useState, useMemo } from "react";
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
  buzzerBeaters?: { id: string; playerId: string; points: number }[];
  onVerify: (_adjustments: {
    teamScore: number;
    oppScore: number;
    teamFouls: number;
    oppFouls: number;
    playerFoulAdjustments: Record<string, number>;
    removedBuzzerBeaterIds: string[];
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
  buzzerBeaters = [],
  onVerify,
}) => {
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

  const [removedBuzzerBeaters, setRemovedBuzzerBeaters] = useState<Set<string>>(
    new Set(),
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

  const handleRemoveBuzzerBeater = (
    id: string,
    points: number,
    isOpp: boolean,
  ) => {
    setRemovedBuzzerBeaters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (isOpp) {
          setOfficialOppScore((p) => (parseInt(p) + points).toString());
        } else {
          setOfficialTeamScore((p) => (parseInt(p) + points).toString());
        }
      } else {
        next.add(id);
        if (isOpp) {
          setOfficialOppScore((p) =>
            Math.max(0, parseInt(p) - points).toString(),
          );
        } else {
          setOfficialTeamScore((p) =>
            Math.max(0, parseInt(p) - points).toString(),
          );
        }
      }
      return next;
    });
  };

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
      removedBuzzerBeaterIds: Array.from(removedBuzzerBeaters),
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
      <DialogTitle
        id="verified-period-modal-title"
        sx={{
          textAlign: "center",
          fontWeight: "var(--cs-typography-fontWeight-bold)",
          color: "var(--cs-semantic-color-text-primary)",
        }}
      >
        Verify {periodLabel} {period} Totals
      </DialogTitle>
      <DialogContent sx={{ p: "var(--cs-semantic-spacing-dialogPadding)" }}>
        <Typography
          variant="body2"
          sx={{
            mb: "var(--cs-semantic-spacing-lg)",
            textAlign: "center",
            color: "var(--cs-semantic-color-text-secondary)",
          }}
        >
          Please reconcile app totals with the official scorekeeper's table.
        </Typography>

        <Box
          sx={{ display: "flex", gap: 3, mb: "var(--cs-semantic-spacing-lg)" }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                mb: "var(--cs-semantic-spacing-sm)",
                display: "block",
                color: "var(--cs-semantic-color-brand-primary-main)",
                textTransform: "uppercase",
              }}
            >
              Our Team
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cs-semantic-spacing-md)",
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
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialTeamFouls}
                onChange={(e) => setOfficialTeamFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.team}`}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                mb: "var(--cs-semantic-spacing-sm)",
                display: "block",
                color: "var(--cs-semantic-color-brand-secondary-main)",
                textTransform: "uppercase",
              }}
            >
              Opponent
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--cs-semantic-spacing-md)",
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
              />
              <TextField
                label="Official Fouls"
                type="number"
                value={officialOppFouls}
                onChange={(e) => setOfficialOppFouls(e.target.value)}
                size="small"
                fullWidth
                helperText={`App: ${appFouls.opp}`}
              />
            </Box>
          </Box>
        </Box>

        {buzzerBeaters.length > 0 && (
          <>
            <Divider sx={{ my: "var(--cs-semantic-spacing-md)" }} />
            <Typography
              variant="subtitle2"
              sx={{
                mb: "var(--cs-semantic-spacing-sm)",
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                color: "var(--cs-semantic-color-text-primary)",
              }}
            >
              Last Shot Validation (Buzzer Beaters)
            </Typography>
            <Box sx={{ mb: "var(--cs-semantic-spacing-md)" }}>
              {buzzerBeaters.map((bb) => {
                const isOpp = bb.playerId.startsWith("OPPONENT");
                const isRemoved = removedBuzzerBeaters.has(bb.id);
                const jersey = bb.playerId.includes(":")
                  ? bb.playerId.split(":")[1]
                  : jerseyMap.get(bb.playerId) || "??";

                return (
                  <Box
                    key={bb.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1,
                      px: 1,
                      mb: 1,
                      bgcolor: isRemoved
                        ? "action.disabledBackground"
                        : "var(--cs-semantic-color-surface-subtle)",
                      borderRadius: "var(--cs-semantic-shape-radius-sm)",
                      border: "1px solid var(--cs-semantic-color-border-subtle)",
                    }}
                  >
                    <Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: "error.main",
                            fontSize: "0.65rem",
                            border: "1px solid",
                            px: 0.5,
                            borderRadius: 0.5,
                          }}
                        >
                          BUZZER BEATER
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {bb.points}pts by #{jersey}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {isOpp ? "Opponent Shot" : "Our Team Shot"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={isRemoved ? "outlined" : "contained"}
                      color={isRemoved ? "primary" : "error"}
                      onClick={() =>
                        handleRemoveBuzzerBeater(bb.id, bb.points, isOpp)
                      }
                      sx={{ fontSize: "0.7rem" }}
                    >
                      {isRemoved ? "Restore" : "Late Shot - Remove"}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        <Divider sx={{ my: "var(--cs-semantic-spacing-md)" }} />

        <Typography
          variant="subtitle2"
          sx={{
            mb: "var(--cs-semantic-spacing-sm)",
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            color: "var(--cs-semantic-color-text-primary)",
          }}
        >
          Individual Player Fouls
        </Typography>

        {sortedPlayers.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontStyle: "italic",
              color: "var(--cs-semantic-color-text-secondary)",
              mb: "var(--cs-semantic-spacing-md)",
            }}
          >
            No players available.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 200,
              overflowY: "auto",
              mb: "var(--cs-semantic-spacing-md)",
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
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustPlayerFoul(pId, -1)}
                      disabled={count === 0}
                      color="primary"
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
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
                    <IconButton
                      size="small"
                      onClick={() => handleAdjustPlayerFoul(pId, 1)}
                      color="primary"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            p: "var(--cs-semantic-spacing-md)",
            bgcolor: "var(--cs-semantic-color-surface-subtle)",
            border: "1px solid var(--cs-semantic-color-border-subtle)",
            borderRadius: "var(--cs-semantic-shape-radius-md)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontStyle: "italic",
              color: "var(--cs-semantic-color-text-secondary)",
              display: "block",
            }}
          >
            Discrepancies will be corrected via SYSTEM_ADJUSTMENT events.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: "var(--cs-semantic-spacing-md)" }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<CheckCircle />}
          onClick={handleConfirm}
          sx={{
            py: 1.5,
            fontWeight: "var(--cs-typography-fontWeight-bold)",
          }}
        >
          Verify & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
