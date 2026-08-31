import React from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import {
  Undo as UndoIcon,
  History,
  SwapHoriz,
  Groups,
  SportsBasketball,
  SyncAlt,
  Sync,
  PlayArrow,
  Pause,
} from "@mui/icons-material";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { useTokens } from "../../theme/useTokens";

/**
 * Interactive controls for game state management.
 */
export interface ActionControlsProps {
  isReadOnly: boolean;
  isLineupIllegal?: boolean;
  isFoulOutConflict?: boolean;
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
  onToggleClock?: () => void;
  onAdjustClock?: (_deltaSeconds: number) => void;
  isClockRunning?: boolean;
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
    isFoulOutConflict = false,
    onFlipPossessionArrow,
    onToggleClock,
    onAdjustClock,
    isClockRunning = false,
  }: ActionControlsProps) => {
    const tokens = useTokens();

    const focusRingSx = {
      "&:focus-visible": {
        outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
        outlineOffset: `${tokens.semantic.focus.offset}px`,
      },
    };

    return (
      <Box
        sx={{
          display: "flex",
          gap: tokens.semantic.spacing.xs,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Tooltip
          title={isClockRunning ? "Stop Game Clock" : "Start Game Clock"}
        >
          <span>
            <Button
              size="small"
              variant="contained"
              startIcon={isClockRunning ? <Pause /> : <PlayArrow />}
              onClick={onToggleClock}
              disabled={isReadOnly || isLineupIllegal || isFoulOutConflict}
              aria-label={
                isClockRunning ? "Stop game clock" : "Start game clock"
              }
              color={isClockRunning ? "warning" : "success"}
              sx={{
                fontWeight: tokens.typography.fontWeight.black,
                minWidth: 100,
                ...focusRingSx,
              }}
            >
              {isClockRunning ? "STOP" : "START"}
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Subtract 1 second from game clock">
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onAdjustClock?.(-1)}
              disabled={
                isReadOnly ||
                isClockRunning ||
                isLineupIllegal ||
                isFoulOutConflict
              }
              aria-label="Subtract 1 second from clock"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                minWidth: tokens.touch.targetComfortable,
                px: tokens.semantic.spacing.xs / 8,
                ...focusRingSx,
              }}
            >
              -1s
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Add 1 second to game clock">
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onAdjustClock?.(1)}
              disabled={
                isReadOnly ||
                isClockRunning ||
                isLineupIllegal ||
                isFoulOutConflict
              }
              aria-label="Add 1 second to clock"
              sx={{
                fontWeight: tokens.typography.fontWeight.bold,
                minWidth: tokens.touch.targetComfortable,
                px: tokens.semantic.spacing.xs / 8,
                ...focusRingSx,
              }}
            >
              +1s
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Advance to Next Period">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onNextPeriod}
              disabled={isReadOnly || isLineupIllegal}
              aria-label="Advance to Next Period"
              aria-haspopup="dialog"
              sx={focusRingSx}
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
              sx={focusRingSx}
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
              sx={focusRingSx}
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
              sx={focusRingSx}
            >
              Sub
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Flip the possession arrow direction manually">
          <span>
            <IconButton
              size="small"
              onClick={onFlipPossessionArrow}
              disabled={isReadOnly}
              aria-label="Flip possession arrow direction"
              sx={{
                border: "1px solid",
                borderColor: tokens.semantic.color.border.default,
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                p: tokens.semantic.spacing.xs / 8,
                transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
                "&:hover": {
                  bgcolor: tokens.semantic.color.action.hover,
                },
                ...focusRingSx,
              }}
            >
              <Sync />
            </IconButton>
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
                border: "1px solid",
                borderColor: tokens.semantic.color.border.default,
                borderRadius: `${tokens.semantic.shape.radius.xs}px`,
                p: tokens.semantic.spacing.xs / 8,
                transition: `all ${tokens.motion.duration.fast} ${tokens.motion.easing.productive}`,
                "&:hover": {
                  bgcolor: tokens.semantic.color.action.hover,
                },
                ...focusRingSx,
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
              sx={focusRingSx}
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
              sx={focusRingSx}
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
              sx={focusRingSx}
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
                aria-haspopup="dialog"
                sx={focusRingSx}
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
