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
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Add as AddIcon,
  Remove as RemoveIcon,
  PersonOff as PersonOffIcon,
} from "@mui/icons-material";
import { Player } from "../../../db";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";
import { EmptyState } from "../../../components/feedback";

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
  oppPeriodPlayerFouls?: Map<string, number>;
  players: Player[];
  jerseyMap: Map<string, string | undefined>;
  buzzerBeaters?: { id: string; playerId: string; points: number }[];
  isVerified?: boolean;
  onUnlock?: (_period: number) => void;
  onVerify: (_adjustments: {
    teamScore: number;
    oppScore: number;
    teamFouls: number;
    oppFouls: number;
    playerFoulAdjustments: Record<string, number>;
    oppPlayerFoulAdjustments: Record<string, number>;
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
  oppPeriodPlayerFouls = new Map(),
  players = [],
  jerseyMap = new Map(),
  buzzerBeaters = [],
  isVerified = false,
  onUnlock,
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

  const [oppPlayerFoulAdjustments, setOppPlayerFoulAdjustments] = useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    if (oppPeriodPlayerFouls) {
      oppPeriodPlayerFouls.forEach((count, jersey) => {
        initial[jersey] = count;
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

  const handleAdjustOppPlayerFoul = (jersey: string, delta: number) => {
    setOppPlayerFoulAdjustments((prev) => ({
      ...prev,
      [jersey]: Math.max(0, (prev[jersey] || 0) + delta),
    }));

    // Auto-calculate official opponent fouls from individual adjustments
    setOfficialOppFouls((prev) =>
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

    const oppAdjustments: Record<string, number> = {};
    Object.keys(oppPlayerFoulAdjustments).forEach((jersey) => {
      const original = oppPeriodPlayerFouls?.get(jersey) || 0;
      const current = oppPlayerFoulAdjustments[jersey];
      if (current !== original) {
        oppAdjustments[`${SPECIAL_PLAYER_IDS.OPPONENT}:${jersey}`] =
          current - original;
      }
    });

    onVerify({
      teamScore: parseInt(officialTeamScore) || 0,
      oppScore: parseInt(officialOppScore) || 0,
      teamFouls: parseInt(officialTeamFouls) || 0,
      oppFouls: parseInt(officialOppFouls) || 0,
      playerFoulAdjustments: adjustments,
      oppPlayerFoulAdjustments: oppAdjustments,
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
          fontWeight: tokens.typography.fontWeight.bold,
          color: tokens.semantic.color.text.primary,
        }}
      >
        Verify {periodLabel} {period} Totals
      </DialogTitle>
      <DialogContent sx={{ p: tokens.semantic.spacing.dialogPadding / 8 }}>
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
                fontWeight: tokens.typography.fontWeight.bold,
                mb: tokens.semantic.spacing.sm / 8,
                display: "block",
                color: tokens.semantic.color.brand.primary.main,
                textTransform: "uppercase",
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
                  htmlInput: { "aria-label": "Official team score" },
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
                  htmlInput: { "aria-label": "Official team fouls" },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                mb: tokens.semantic.spacing.sm / 8,
                display: "block",
                color: tokens.semantic.color.brand.secondary.main,
                textTransform: "uppercase",
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
                  htmlInput: { "aria-label": "Official opponent score" },
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
                  htmlInput: { "aria-label": "Official opponent fouls" },
                }}
              />
            </Box>
          </Box>
        </Box>

        {buzzerBeaters.length > 0 && (
          <>
            <Divider sx={{ my: tokens.semantic.spacing.md / 8 }} />
            <Typography
              variant="subtitle2"
              sx={{
                mb: tokens.semantic.spacing.sm / 8,
                fontWeight: tokens.typography.fontWeight.bold,
                color: tokens.semantic.color.text.primary,
              }}
            >
              Last Shot Validation (Buzzer Beaters)
            </Typography>
            <Box sx={{ mb: tokens.semantic.spacing.md / 8 }}>
              {buzzerBeaters.map((bb) => {
                const isOpp = bb.playerId.startsWith("OPPONENT");
                const isRemoved = removedBuzzerBeaters.has(bb.id);
                const jersey = bb.playerId.includes(":")
                  ? bb.playerId.split(":")[1]
                  : (jerseyMap.get(bb.playerId) ?? "??");

                return (
                  <Box
                    key={bb.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: tokens.semantic.spacing.xs / 8,
                      px: tokens.semantic.spacing.xs / 8,
                      mb: tokens.semantic.spacing.xs / 8,
                      bgcolor: isRemoved
                        ? tokens.semantic.color.action.disabledBackground
                        : tokens.semantic.color.surface.subtle,
                      borderRadius: `${tokens.semantic.shape.radius.sm}px`,
                      border: `1px solid ${tokens.semantic.color.border.subtle}`,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: tokens.semantic.spacing.xs / 8,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: tokens.typography.fontWeight.bold,
                            color: tokens.semantic.color.feedback.error.main,
                            fontSize: tokens.typography.fontSize.xs,
                            border: "1px solid",
                            px: 0.5,
                            borderRadius: `${tokens.semantic.shape.radius.xs / 8}px`,
                          }}
                        >
                          BUZZER BEATER
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: tokens.typography.fontWeight.semibold,
                          }}
                        >
                          {bb.points}pts by #{jersey}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {isOpp ? "Opponent Shot" : "Our Team Shot"}
                      </Typography>
                    </Box>
                    <Tooltip
                      title={
                        isRemoved
                          ? `Restore buzzer beater shot by #${jersey}`
                          : `Disallow buzzer beater shot by #${jersey} (Late Shot)`
                      }
                    >
                      <Button
                        size="small"
                        variant={isRemoved ? "outlined" : "contained"}
                        color={isRemoved ? "primary" : "error"}
                        onClick={() =>
                          handleRemoveBuzzerBeater(bb.id, bb.points, isOpp)
                        }
                        aria-label={
                          isRemoved
                            ? `Restore buzzer beater by #${jersey}`
                            : `Remove buzzer beater by #${jersey}`
                        }
                        sx={{ fontSize: tokens.typography.fontSize.xs }}
                      >
                        {isRemoved ? "Restore" : "Late Shot - Remove"}
                      </Button>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        <Divider sx={{ my: tokens.semantic.spacing.md / 8 }} />

        <Typography
          variant="subtitle2"
          sx={{
            mb: tokens.semantic.spacing.sm / 8,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.semantic.color.text.primary,
          }}
        >
          Our Player Fouls
        </Typography>

        {sortedPlayers.length === 0 ? (
          <Box sx={{ mb: tokens.semantic.spacing.md / 8 }}>
            <EmptyState
              icon={
                <PersonOffIcon
                  sx={{ fontSize: tokens.semantic.component.iconSize.xl }}
                />
              }
              title="No players available"
              description="No players found in your roster. Please add players to track fouls."
            />
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 120,
              overflowY: "auto",
              mb: tokens.semantic.spacing.md / 8,
              pr: 1,
            }}
          >
            {sortedPlayers.map((player) => {
              const pId = player.id?.toString() || "";
              const count = playerFoulAdjustments[pId] || 0;
              const jersey = jerseyMap.get(pId) ?? "??";
              return (
                <Box
                  key={pId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: tokens.semantic.spacing.xs / 8,
                    borderBottom: `1px solid ${tokens.semantic.color.border.subtle}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: tokens.typography.fontWeight.medium }}
                  >
                    #{jersey} {player.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: tokens.semantic.spacing.xs / 8,
                    }}
                  >
                    <Tooltip title="Decrease fouls">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustPlayerFoul(pId, -1)}
                          disabled={count === 0}
                          color="primary"
                          aria-label={`Decrease fouls for ${player.name}`}
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
                        fontWeight: tokens.typography.fontWeight.bold,
                      }}
                    >
                      {count}
                    </Typography>
                    <Tooltip title="Increase fouls">
                      <IconButton
                        size="small"
                        onClick={() => handleAdjustPlayerFoul(pId, 1)}
                        color="primary"
                        aria-label={`Increase fouls for ${player.name}`}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <Typography
          variant="subtitle2"
          sx={{
            mb: tokens.semantic.spacing.sm / 8,
            fontWeight: tokens.typography.fontWeight.bold,
            color: tokens.semantic.color.text.primary,
          }}
        >
          Opponent Player Fouls
        </Typography>

        {Object.keys(oppPlayerFoulAdjustments).length === 0 ? (
          <Box sx={{ mb: tokens.semantic.spacing.md / 8 }}>
            <Typography variant="caption" color="text.secondary">
              No opponent player actions recorded.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 120,
              overflowY: "auto",
              mb: tokens.semantic.spacing.md / 8,
              pr: 1,
            }}
          >
            {Object.keys(oppPlayerFoulAdjustments)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map((jersey) => {
                const count = oppPlayerFoulAdjustments[jersey] || 0;
                return (
                  <Box
                    key={jersey}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: tokens.semantic.spacing.xs / 8,
                      borderBottom: `1px solid ${tokens.semantic.color.border.subtle}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: tokens.typography.fontWeight.medium }}
                    >
                      #{jersey} Opponent
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: tokens.semantic.spacing.xs / 8,
                      }}
                    >
                      <Tooltip title="Decrease fouls">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleAdjustOppPlayerFoul(jersey, -1)
                            }
                            disabled={count === 0}
                            color="secondary"
                            aria-label={`Decrease fouls for opponent #${jersey}`}
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
                          fontWeight: tokens.typography.fontWeight.bold,
                        }}
                      >
                        {count}
                      </Typography>
                      <Tooltip title="Increase fouls">
                        <IconButton
                          size="small"
                          onClick={() => handleAdjustOppPlayerFoul(jersey, 1)}
                          color="secondary"
                          aria-label={`Increase fouls for opponent #${jersey}`}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
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
      <DialogActions sx={{ p: tokens.semantic.spacing.md / 8, flexDirection: "column", gap: 1 }}>
        {isVerified && onUnlock && (
          <Button
            fullWidth
            variant="outlined"
            color="warning"
            onClick={() => {
              onUnlock(period);
              onClose();
            }}
            sx={{ fontWeight: tokens.typography.fontWeight.bold }}
          >
            Unlock Period {period} Stats
          </Button>
        )}
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
