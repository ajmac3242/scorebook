import React from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import {
  Undo as UndoIcon,
  History,
  SwapHoriz,
  Groups,
  SportsBasketball,
  SyncAlt,
  Sync,
} from "@mui/icons-material";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

/**
 * Interactive controls for game state management.
 */
export interface ActionControlsProps {
  isReadOnly: boolean;
  isLineupIllegal?: boolean;
  onUndo: () => void;
  onQuickSub: () => void;
  onFtWorkflow: () => void;
  onAuditSubs: () => void;
  onTimeout: () => void;
  onNextPeriod: () => void;
  onTogglePossession: () => void;
  onOpponentTurnover: () => void;
  possessionState: string | null;
  recentStatsLength: number;
  onEndGame: () => void;
  isGameCompleted: boolean;
  isEnding?: boolean;
  onFlipPossessionArrow?: () => void;
}

export const ActionControls = React.memo(
  ({
    isReadOnly,
    onUndo,
    onQuickSub,
    onFtWorkflow,
    onAuditSubs,
    onTimeout,
    onNextPeriod,
    onTogglePossession,
    onOpponentTurnover,
    possessionState,
    recentStatsLength,
    onEndGame,
    isGameCompleted,
    isEnding,
    isLineupIllegal = false,
    onFlipPossessionArrow,
  }: ActionControlsProps) => {
    const tokens = useTokens();

    return (
      <Box
        sx={{
          display: "flex",
          gap: tokens.semantic.spacing.xs / 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Tooltip title="Advance to Next Period">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onNextPeriod}
              disabled={isReadOnly || isLineupIllegal}
              aria-label="Advance to Next Period"
              sx={{
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              Period
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Record a turnover for the opponent and flip possession">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SyncAlt />}
              onClick={onOpponentTurnover}
              disabled={isReadOnly || isLineupIllegal}
              aria-label="record opponent turnover"
              color="secondary"
              sx={{
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-brand-secondary-main)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              Opp TO
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Toggle ball possession between teams">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SwapHoriz />}
              onClick={onTogglePossession}
              disabled={isReadOnly || isLineupIllegal}
              aria-label={
                possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                  ? "Change possession to Opponent"
                  : "Change possession to Our Team"
              }
              aria-pressed={!!possessionState}
              color={possessionState ? "primary" : "inherit"}
              sx={{
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              Poss
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Manage Lineup Substitutions">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Groups />}
              onClick={onQuickSub}
              disabled={isReadOnly}
              aria-label="manage lineup substitutions"
              aria-haspopup="dialog"
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
                },
              }}
            >
              Sub
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Flip possession arrow manually">
          <span>
            <IconButton
              size="small"
              onClick={onFlipPossessionArrow}
              disabled={isReadOnly}
              aria-label="Flip possession arrow manually"
              sx={{
                border: `1px solid ${tokens.semantic.color.border.default}`,
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                p: 0.625, // 5px / 8 = 0.625
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              <Sync />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="View substitution history">
          <span>
            <IconButton
              size="small"
              onClick={() => onAuditSubs()}
              disabled={isReadOnly}
              aria-label="View substitution history"
              aria-haspopup="dialog"
              sx={{
                border: `1px solid ${tokens.semantic.color.border.default}`,
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                p: 0.625, // 5px / 8 = 0.625
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              <History />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Log a timeout for the active team">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onTimeout}
              disabled={isReadOnly || isLineupIllegal}
              aria-label="log team timeout"
              sx={{
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-action-focusRing)`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              Timeout
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Open Free Throw Scoring Workflow">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SportsBasketball />}
              onClick={() => onFtWorkflow()}
              disabled={isReadOnly || isLineupIllegal}
              aria-label="record free throws"
              aria-haspopup="dialog"
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
                },
              }}
            >
              FT
            </Button>
          </span>
        </Tooltip>

        <Tooltip
          title={
            recentStatsLength === 0
              ? "No actions to undo"
              : "Revert the last recorded action (Ctrl+Z or ⌘Z)"
          }
        >
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={onUndo}
              disabled={recentStatsLength === 0 || isReadOnly}
              aria-label={
                recentStatsLength === 0
                  ? "undo last action (no actions to undo)"
                  : "undo last action"
              }
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
                },
              }}
            >
              Undo
            </Button>
          </span>
        </Tooltip>

        {!isGameCompleted && !isReadOnly && (
          <Tooltip title="Finalize and save game results">
            <span>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={onEndGame}
                disabled={isEnding || isLineupIllegal}
                aria-label="End and Save Game"
                sx={{
                  "&:focus-visible": {
                    outline: `${tokens.semantic.focus.width}px solid var(--cs-semantic-color-feedback-error-main)`,
                    outlineOffset: tokens.semantic.focus.offset,
                  },
                }}
              >
                {isEnding ? "Ending..." : "End Game"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Box>
    );
  },
);
