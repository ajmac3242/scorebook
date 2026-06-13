import React from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import {
  Undo as UndoIcon,
  History,
  SwapHoriz,
  Groups,
  SportsBasketball,
  SyncAlt,
} from "@mui/icons-material";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";

/**
 * Interactive controls for game state management.
 */
export interface ActionControlsProps {
  isReadOnly: boolean;
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
  }: ActionControlsProps) => {
    return (
      <Box
        sx={{
          display: "flex",
          gap: "var(--cs-semantic-spacing-xs)",
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
              disabled={isReadOnly}
              aria-label="Advance to Next Period"
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
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
              disabled={isReadOnly}
              aria-label="record opponent turnover"
              color="secondary"
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-brand-secondary-main)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
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
              disabled={isReadOnly}
              aria-label={
                possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
                  ? "Change possession to Opponent"
                  : "Change possession to Our Team"
              }
              aria-pressed={!!possessionState}
              color={possessionState ? "primary" : "inherit"}
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
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

        <Tooltip title="View history and correct substitution errors">
          <span>
            <IconButton
              size="small"
              onClick={() => onAuditSubs()}
              disabled={isReadOnly}
              aria-label="Audit substitutions history"
              aria-haspopup="dialog"
              sx={{
                border: "1px solid var(--cs-semantic-color-border-default)",
                borderRadius: "var(--cs-semantic-shape-radius-xs)",
                p: "5px",
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
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
              disabled={isReadOnly}
              aria-label="log team timeout"
              sx={{
                "&:focus-visible": {
                  outline:
                    "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing)",
                  outlineOffset: "var(--cs-semantic-focus-offset)",
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
              disabled={isReadOnly}
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
                disabled={isEnding}
                aria-label={isEnding ? "Saving game results..." : "End and Save Game"}
                sx={{
                  "&:focus-visible": {
                    outline:
                      "var(--cs-semantic-focus-width) solid var(--cs-semantic-color-feedback-error-main)",
                    outlineOffset: "var(--cs-semantic-focus-offset)",
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
