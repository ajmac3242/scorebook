import React from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import {
  Undo as UndoIcon,
  History,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  FlashOn,
  Groups,
  Star as StarIcon,
  ElectricBolt as ElectricBoltIcon,
  GridOn,
} from "@mui/icons-material";
import { ACTION_TYPES, SPECIAL_PLAYER_IDS } from "../../constants/stats";

export interface ActionControlsProps {
  isReadOnly: boolean;
  onUndo: () => void;
  onQuickSub: () => void;
  onFtWorkflow: () => void;
  onAuditSubs: () => void;
  onTimeout: () => void;
  onNextPeriod: () => void;
  onTogglePossession: () => void;
  onFlagPlay: () => void;
  onRecordHustle: (_type: string) => void;
  possessionState: string | null;
  recentStatsLength: number;
  onEndGame: () => void;
  isGameCompleted: boolean;
  onToggleClutchAdvisor: () => void;
  forceClutchAdvisor: boolean;
  onToggleMatrix: () => void;
  showMatrix: boolean;
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
    onFlagPlay,
    onRecordHustle,
    possessionState,
    recentStatsLength,
    onEndGame,
    isGameCompleted,
    onToggleClutchAdvisor,
    forceClutchAdvisor,
    onToggleMatrix,
    showMatrix,
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
        <Tooltip title="Advance to Next Period (P)">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onNextPeriod}
              disabled={isReadOnly}
              aria-label="Advance to Next Period (P)"
            >
              Period
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Record Deflection">
          <span>
            <IconButton
              size="small"
              onClick={() => onRecordHustle(ACTION_TYPES.DEFLECTION)}
              disabled={isReadOnly}
              aria-label="record deflection"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
                color: "secondary.main",
              }}
            >
              <ElectricBoltIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Record Floor Dive">
          <span>
            <IconButton
              size="small"
              onClick={() => onRecordHustle(ACTION_TYPES.FLOOR_DIVE)}
              disabled={isReadOnly}
              aria-label="record floor dive"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
                color: "success.main",
              }}
            >
              <Groups fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Record Charge Taken">
          <span>
            <IconButton
              size="small"
              onClick={() => onRecordHustle(ACTION_TYPES.CHARGE_TAKEN)}
              disabled={isReadOnly}
              aria-label="record charge taken"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
                color: "error.main",
              }}
            >
              <PanTool fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Record Great Contest">
          <span>
            <IconButton
              size="small"
              onClick={() => onRecordHustle(ACTION_TYPES.GREAT_CONTEST)}
              disabled={isReadOnly}
              aria-label="record great contest"
              sx={{
                border: "1px solid rgba(0,0,0,0.23)",
                borderRadius: "4px",
                p: "5px",
                color: "info.main",
              }}
            >
              <FlashOn fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Flag last action for review">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<StarIcon />}
              onClick={onFlagPlay}
              disabled={recentStatsLength === 0 || isReadOnly}
              aria-label="Flag last play for review"
              sx={{
                borderColor: "warning.light",
                color: "warning.dark",
                "&:hover": {
                  borderColor: "warning.main",
                  bgcolor: "rgba(255, 152, 0, 0.04)",
                },
              }}
            >
              Flag
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
                  ? "Possession: Team. Click to switch to Opponent."
                  : "Possession: Opponent. Click to switch to Team."
              }
              color={possessionState ? "primary" : "inherit"}
            >
              Poss
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Quick Substitution (S)">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Groups />}
              onClick={onQuickSub}
              disabled={isReadOnly}
              aria-label="Quick Substitution (S)"
              aria-haspopup="dialog"
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

        <Tooltip title="Record Team Timeout (T)">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<History />}
              onClick={onTimeout}
              disabled={isReadOnly}
              aria-label="Record Team Timeout (T)"
              aria-haspopup="dialog"
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
              aria-label="Record Free Throws Workflow"
              aria-haspopup="dialog"
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
              aria-haspopup="dialog"
            >
              Undo
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Toggle Efficiency Matrix">
          <span>
            <IconButton
              size="small"
              onClick={onToggleMatrix}
              aria-label="Toggle Efficiency Matrix"
              sx={{
                border: "1px solid",
                borderColor: showMatrix ? "primary.main" : "rgba(0,0,0,0.23)",
                bgcolor: showMatrix
                  ? "rgba(25, 118, 210, 0.04)"
                  : "transparent",
                borderRadius: "4px",
                p: "5px",
                color: showMatrix ? "primary.main" : "inherit",
              }}
            >
              <GridOn />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Toggle Clutch Playbook Advisor">
          <span>
            <IconButton
              size="small"
              onClick={onToggleClutchAdvisor}
              aria-label="Toggle Clutch Advisor"
              sx={{
                border: "1px solid",
                borderColor: forceClutchAdvisor
                  ? "primary.main"
                  : "rgba(0,0,0,0.23)",
                bgcolor: forceClutchAdvisor
                  ? "rgba(25, 118, 210, 0.04)"
                  : "transparent",
                borderRadius: "4px",
                p: "5px",
                color: forceClutchAdvisor ? "primary.main" : "inherit",
              }}
            >
              <StarIcon />
            </IconButton>
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
              aria-haspopup="dialog"
            >
              End Game
            </Button>
          </Tooltip>
        )}
      </Box>
    );
  },
);
