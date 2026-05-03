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
              ? "Switch possession to Opponent"
              : "Switch possession to Team"
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
                  ? "Switch possession to Opponent"
                  : "Switch possession to Team"
              }
              color={possessionState ? "primary" : "inherit"}
            >
              Poss
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Quick Substitution">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Groups />}
              onClick={onQuickSub}
              disabled={isReadOnly}
              aria-label="quick substitution"
            >
              Sub
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Audit Substitutions">
          <span>
            <IconButton
              size="small"
              onClick={() => onAuditSubs()}
              aria-label="audit substitutions"
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

        <Tooltip title="Record Team Timeout">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onTimeout}
              disabled={isReadOnly}
              aria-label="Record Team Timeout"
            >
              Timeout
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Record Free Throws">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SportsBasketball />}
              onClick={() => onFtWorkflow()}
              disabled={isReadOnly}
              aria-label="record free throws"
            >
              FT
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Undo last action (Ctrl+Z)">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={onUndo}
              disabled={recentStatsLength === 0 || isReadOnly}
              aria-label="Undo last action"
            >
              Undo
            </Button>
          </span>
        </Tooltip>

        {!isGameCompleted && !isReadOnly && (
          <Tooltip title="Finalize and save game results">
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={onEndGame}
              aria-label="End and Save Game"
            >
              End Game
            </Button>
          </Tooltip>
        )}
      </Box>
    );
  },
);
