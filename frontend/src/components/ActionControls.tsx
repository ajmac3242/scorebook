import React from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import {
  Undo as UndoIcon,
  History,
  SwapHoriz,
  Groups,
  SportsBasketball,
} from "@mui/icons-material";
import { SPECIAL_PLAYER_IDS } from "../constants/stats";

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
          gap: 1,
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
            >
              Period
            </Button>
          </span>
        </Tooltip>

        <Tooltip
          title={
            possessionState === SPECIAL_PLAYER_IDS.OUR_TEAM
              ? "Change possession to Opponent"
              : "Change possession to Our Team"
          }
        >
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
              aria-label="audit substitutions history"
              aria-haspopup="dialog"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
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
            >
              FT
            </Button>
          </span>
        </Tooltip>

        <Tooltip
          title={
            recentStatsLength === 0
              ? "No actions to undo"
              : "Revert the last recorded action (Ctrl+Z)"
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
                aria-label="End and Save Game"
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
