import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Stack,
} from "@mui/material";
import {
  Check,
  Close,
  SportsBasketball,
  PanTool,
  SwapHoriz,
  FlashOn,
  ArrowBack,
  Warning,
  Shield,
} from "@mui/icons-material";
import { SvgIconComponent } from "@mui/icons-material";
import { ACTION_TYPES, SHOT_QUALITY, SITUATIONS, SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { formatClock } from "../../utils/mathUtils";
import { QuickAction } from "./GameModeComponents";
import { PlayerAggregates } from "../../utils/stats/types";

interface StatEntryDialogProps {
  open: boolean;
  onClose: () => void;
  selectedPlayerId: string | null;
  statType: string | null;
  points: number;
  playName: string;
  shotQuality: string | null;
  situation: string | null;
  trackingMode: "TEAM" | "OPPONENT";
  players: PlayerAggregates[];
  onCourtIds: Set<string>;
  jerseyMap: Map<string, string | undefined>;
  onSave: () => Promise<void>;
  onSetStatType: (_type: string | null) => void;
  onSetSelectedPlayerId: (_id: string | null) => void;
  onSetPoints: (_pts: number) => void;
  onSetPlayName: (_name: string) => void;
  onSetShotQuality: (_quality: string | null) => void;
  onSetSituation: (_sit: string | null) => void;
  isEditing: boolean;
  isSavingStat: boolean;
  playerName: string;
  periodLabel: string;
  period: number;
  clockSeconds: number;
  teamPlaybook: string[];
  periodType: string;
  oppFouls: number;
}

const StatEntryDialog: React.FC<StatEntryDialogProps> = ({
  open,
  onClose,
  selectedPlayerId,
  statType,
  points,
  playName,
  shotQuality,
  situation,
  trackingMode,
  players,
  onCourtIds,
  jerseyMap,
  onSave,
  onSetStatType,
  onSetSelectedPlayerId,
  onSetPoints,
  onSetPlayName,
  onSetShotQuality,
  onSetSituation,
  isEditing,
  isSavingStat,
  playerName,
  periodLabel,
  period,
  clockSeconds,
  teamPlaybook,
  periodType,
  oppFouls,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-describedby="stat-dialog-player-info"
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          selectedPlayerId &&
          statType &&
          !isSavingStat
        ) {
          e.preventDefault();
          onSave();
          return;
        }

        if (isSavingStat) return;

        const key = e.key.toLowerCase();
        const actionMap: Record<string, string> = {
          m: ACTION_TYPES.MAKE,
          x: ACTION_TYPES.MISS,
          o: ACTION_TYPES.OFF_REBOUND,
          d: ACTION_TYPES.DEF_REBOUND,
          a: ACTION_TYPES.ASSIST,
          t: ACTION_TYPES.TURNOVER,
          s: ACTION_TYPES.STEAL,
          b: ACTION_TYPES.BLOCK,
          f: ACTION_TYPES.FOUL_SHOOTING,
        };

        if (actionMap[key]) {
          onSetStatType(actionMap[key]);
        }
      }}
    >
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        {isEditing ? "Edit Action" : "Record Action"}
      </DialogTitle>
      <DialogContent>
        <Box
          id="stat-dialog-player-info"
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "rgba(0,0,0,0.03)",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor:
                trackingMode === "OPPONENT"
                  ? "secondary.main"
                  : "primary.main",
            }}
          >
            {selectedPlayerId
              ? trackingMode === "OPPONENT"
                ? "OP"
                : jerseyMap.get(selectedPlayerId) || "?"
              : "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {playerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {periodLabel} {period} | {formatClock(clockSeconds)}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          gutterBottom
          sx={{ display: "block", mb: 1 }}
        >
          Action Type
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            mb: 3,
          }}
        >
          {[
            { type: ACTION_TYPES.MAKE, label: "Make", icon: Check },
            { type: ACTION_TYPES.MISS, label: "Miss", icon: Close },
            {
              type: ACTION_TYPES.OFF_REBOUND,
              label: "Off Reb",
              icon: SportsBasketball,
            },
            {
              type: ACTION_TYPES.DEF_REBOUND,
              label: "Def Reb",
              icon: SportsBasketball,
            },
            { type: ACTION_TYPES.ASSIST, label: "Assist", icon: PanTool },
            {
              type: ACTION_TYPES.TURNOVER,
              label: "Turnover",
              icon: SwapHoriz,
            },
            { type: ACTION_TYPES.STEAL, label: "Steal", icon: FlashOn },
            { type: ACTION_TYPES.BLOCK, label: "Block", icon: ArrowBack },
            {
              type: ACTION_TYPES.FOUL_SHOOTING,
              label: "S. Foul",
              icon: Warning,
            },
            {
              type: ACTION_TYPES.FLOOR_DIVE,
              label: "Floor Dive",
              icon: SportsBasketball,
            },
            {
              type: ACTION_TYPES.CHARGE_TAKEN,
              label: "Charge",
              icon: PanTool,
            },
            {
              type: ACTION_TYPES.GREAT_CONTEST,
              label: "Contest",
              icon: Shield,
            },
          ].map((action) => (
            <QuickAction
              key={action.type}
              type={action.type}
              label={action.label}
              icon={action.icon as SvgIconComponent}
              statType={statType}
              onClick={onSetStatType}
            />
          ))}
        </Box>

        {trackingMode === "TEAM" && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ display: "block", mb: 1 }}
            >
              Who?
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 1,
              }}
            >
              {players
                .filter((p) => onCourtIds.has(p.id!.toString()))
                .map((p) => (
                  <Button
                    key={p.id}
                    variant={
                      selectedPlayerId === p.id!.toString() ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() => onSetSelectedPlayerId(p.id!.toString())}
                    sx={{
                      minWidth: 0,
                      fontWeight: 700,
                      borderColor: "#D1D1D1",
                    }}
                  >
                    {jerseyMap.get(p.id!.toString())}
                  </Button>
                ))}
            </Box>
          </Box>
        )}

        {trackingMode === "OPPONENT" && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ display: "block", mb: 1 }}
            >
              Opponent Jersey # (Optional)
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {[
                "0", "1", "2", "3", "4", "5", "10", "11", "12", "23", "24", "30", "32", "33", "34", "35",
              ].map((num) => {
                const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
                return (
                  <Button
                    key={num}
                    variant={
                      selectedPlayerId === oppId ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() =>
                      onSetSelectedPlayerId(
                        selectedPlayerId === oppId
                          ? SPECIAL_PLAYER_IDS.OPPONENT
                          : oppId,
                      )
                    }
                    sx={{
                      minWidth: 40,
                      fontWeight: 700,
                      borderColor: "#D1D1D1",
                    }}
                  >
                    {num}
                  </Button>
                );
              })}
            </Box>
            {(() => {
              const pId = selectedPlayerId || "";
              const isOpp =
                pId === SPECIAL_PLAYER_IDS.OPPONENT ||
                pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
              if (!isOpp) return null;

              const foulsRequiredForBonus = periodType === "QUARTERS" ? 5 : 7;
              const foulsForWarning = foulsRequiredForBonus - 1;

              if (oppFouls >= foulsRequiredForBonus) {
                return (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "center",
                      color: "error.main",
                      fontWeight: 900,
                      fontSize: "0.55rem",
                      mt: 0.5,
                    }}
                  >
                    IN BONUS
                  </Typography>
                );
              } else if (oppFouls === foulsForWarning) {
                return (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "center",
                      color: "warning.main",
                      fontWeight: 700,
                      fontSize: "0.55rem",
                      mt: 0.5,
                    }}
                  >
                    NEXT: BONUS
                  </Typography>
                );
              }
              return null;
            })()}
          </Box>
        )}

        {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
          trackingMode === "TEAM" &&
          teamPlaybook.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="caption"
                gutterBottom
                sx={{ display: "block", mb: 1 }}
              >
                Offensive Play
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {teamPlaybook.map((play) => (
                  <Chip
                    key={play}
                    label={play}
                    size="small"
                    onClick={() => onSetPlayName(playName === play ? "" : play)}
                    color={playName === play ? "primary" : "default"}
                    variant={playName === play ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Box>
          )}
        {(statType === ACTION_TYPES.MAKE ||
          statType === ACTION_TYPES.MISS) && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ display: "block", mb: 1 }}
            >
              Situation
            </Typography>
            <ToggleButtonGroup
              value={situation}
              exclusive
              onChange={(_, val) => onSetSituation(val)}
              size="small"
              fullWidth
            >
              {Object.values(SITUATIONS).map((sit) => (
                <ToggleButton key={sit} value={sit}>
                  {sit}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        {(statType === ACTION_TYPES.MAKE ||
          statType === ACTION_TYPES.MISS) && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ display: "block", mb: 1 }}
            >
              Shot Quality
            </Typography>
            <ToggleButtonGroup
              value={shotQuality}
              exclusive
              onChange={(_, val) => onSetShotQuality(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value={SHOT_QUALITY.OPEN}>Open</ToggleButton>
              <ToggleButton value={SHOT_QUALITY.CONTESTED}>
                Contested
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {statType === ACTION_TYPES.MAKE && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ display: "block", mb: 1 }}
            >
              Points
            </Typography>
            <Stack direction="row" spacing={1}>
              {[1, 2, 3].map((pts) => (
                <Button
                  key={pts}
                  fullWidth
                  variant={points === pts ? "contained" : "outlined"}
                  onClick={() => onSetPoints(pts)}
                >
                  {pts}
                </Button>
              ))}
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => onSave()}
          variant="contained"
          disabled={!selectedPlayerId || !statType || isSavingStat}
        >
          {isSavingStat ? "Saving..." : isEditing ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(StatEntryDialog);
