import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
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
import {
  ACTION_TYPES,
  SHOT_QUALITY,
  SITUATIONS,
} from "../../../constants/stats";
import {
  getPlayerDisplayName,
  type PlayerAggregates,
} from "../../../utils/stats";
import { formatClock } from "../../../utils/mathUtils";
import { QuickAction } from "../GameModeComponents";
import { OpponentBonusChip } from "../OpponentBonusChip";
import { OpponentJerseyPicker } from "./OpponentJerseyPicker";
import type { Player } from "../../../db";
import type { Team } from "../../../db";
import type { Game } from "../../../db";

type StatEntryDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (_type?: string | null) => void;
  isEditing: boolean;
  isSavingStat: boolean;
  // player/tracking context
  trackingMode: "TEAM" | "OPPONENT";
  selectedPlayerId: string | null;
  setSelectedPlayerId: (_id: string | null) => void;
  players: Player[];
  jerseyMap: Map<string, string>;
  draftOnCourtIds: Set<string>;
  playerNamesMap: Map<string, string>;
  game: Game | undefined;
  team: Team | undefined;
  // stat state
  statType: string | null;
  setStatType: (_type: string | null) => void;
  points: number;
  setPoints: (_pts: number) => void;
  playName: string;
  setPlayName: (_name: string) => void;
  shotQuality: string | null;
  setShotQuality: (_q: string | null) => void;
  situation: string | null;
  setSituation: (_s: string | null) => void;
  opponentPlayType: string | null;
  setOpponentPlayType: (_pt: string | null) => void;
  // display
  periodLabel: string;
  period: number;
  clockSeconds: number;
  isClockRunning: boolean;
  oppFouls: number;
  periodType: string;
  statsMap: Map<string, PlayerAggregates>;
};

export const StatEntryDialog: React.FC<StatEntryDialogProps> = ({
  open,
  onClose,
  onSave,
  isEditing,
  isSavingStat,
  trackingMode,
  selectedPlayerId,
  setSelectedPlayerId,
  players,
  jerseyMap,
  draftOnCourtIds,
  playerNamesMap,
  game,
  team,
  statType,
  setStatType,
  points,
  setPoints,
  playName,
  setPlayName,
  shotQuality,
  setShotQuality,
  situation,
  setSituation,
  opponentPlayType,
  setOpponentPlayType,
  periodLabel,
  period,
  clockSeconds,
  isClockRunning,
  oppFouls,
  periodType,
  statsMap,
}) => {
  const isPlayerFouledOut = (pId: string | null) => {
    if (!pId) return false;
    const stats = statsMap.get(pId);
    const pf = stats?.fouls || 0;
    const foulLimit = game?.foulLimit || team?.defaultFoulLimit || 5;
    return pf >= foulLimit;
  };

  const selectedIsFouledOut = isPlayerFouledOut(selectedPlayerId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-describedby="stat-dialog-player-info"
      slotProps={{
        paper: {
          "data-testid": "stat-dialog",
          "data-points": points,
          "data-stattype": statType ?? "",
        } as React.ComponentPropsWithRef<"div">,
      }}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          selectedPlayerId &&
          statType &&
          !isSavingStat &&
          !selectedIsFouledOut &&
          clockSeconds > 0
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
        if (actionMap[key]) setStatType(actionMap[key]);
        if (key === "p") setStatType(ACTION_TYPES.PAINT_TOUCH);
      }}
    >
      <DialogTitle>{isEditing ? "Edit Action" : "Record Action"}</DialogTitle>
      <DialogContent>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mb: 2, alignItems: "center" }}
          id="stat-dialog-player-info"
        >
          <Avatar sx={{ bgcolor: "primary.main", fontWeight: 900 }}>
            {selectedPlayerId
              ? trackingMode === "OPPONENT"
                ? "OP"
                : jerseyMap.get(selectedPlayerId) || "?"
              : "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {selectedPlayerId
                ? getPlayerDisplayName(
                    selectedPlayerId,
                    playerNamesMap,
                    game?.opponent,
                    team?.name,
                  )
                : "Select a player..."}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {periodLabel} {period} | {formatClock(clockSeconds)}
            </Typography>
          </Box>
        </Stack>

        {!isClockRunning && clockSeconds > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              bgcolor: "warning.light",
              color: "warning.contrastText",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Warning fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              CLOCK STOPPED: Ensure action occurred before the whistle.
            </Typography>
          </Box>
        )}

        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            display: "block",
            mb: 1,
            textTransform: "uppercase",
          }}
        >
          Action Type
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            mb: 2,
          }}
        >
          {[
            { type: ACTION_TYPES.MAKE, label: "Make (M)", icon: Check },
            { type: ACTION_TYPES.MISS, label: "Miss (X)", icon: Close },
            {
              type: ACTION_TYPES.OFF_REBOUND,
              label: "Off Reb (O)",
              icon: SportsBasketball,
            },
            {
              type: ACTION_TYPES.DEF_REBOUND,
              label: "Def Reb (D)",
              icon: SportsBasketball,
            },
            { type: ACTION_TYPES.ASSIST, label: "Assist (A)", icon: PanTool },
            {
              type: ACTION_TYPES.TURNOVER,
              label: "Turnover (T)",
              icon: SwapHoriz,
            },
            { type: ACTION_TYPES.STEAL, label: "Steal (S)", icon: FlashOn },
            { type: ACTION_TYPES.BLOCK, label: "Block (B)", icon: ArrowBack },
            {
              type: ACTION_TYPES.FOUL_SHOOTING,
              label: "S. Foul (F)",
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
            {
              type: ACTION_TYPES.PAINT_TOUCH,
              label: "Paint Touch (P)",
              icon: SportsBasketball,
            },
            {
              type: ACTION_TYPES.HELD_BALL,
              label: "Held Ball",
              icon: SportsBasketball,
            },
          ].map((action) => (
            <QuickAction
              key={action.type}
              type={action.type}
              label={action.label}
              icon={action.icon}
              statType={statType}
              onClick={setStatType}
            />
          ))}
        </Box>

        {trackingMode === "TEAM" && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                display: "block",
                mb: 1,
                textTransform: "uppercase",
              }}
            >
              Who?
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {players
                .filter((p) => draftOnCourtIds.has(p.id!))
                .map((p) => {
                  const isFouledOut = isPlayerFouledOut(p.id!);
                  return (
                    <Button
                      key={p.id}
                      variant={
                        selectedPlayerId === p.id ? "contained" : "outlined"
                      }
                      size="small"
                      onClick={() => setSelectedPlayerId(p.id!)}
                      sx={{
                        minWidth: 0,
                        fontWeight: 700,
                        borderColor: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "var(--cs-semantic-color-border-default)",
                        fontSize: "var(--cs-typography-fontSize-xs)",
                        textDecoration: isFouledOut ? "line-through" : "none",
                        color: isFouledOut
                          ? "var(--cs-semantic-color-feedback-error-main)"
                          : "inherit",
                      }}
                    >
                      {jerseyMap.get(p.id!)}
                      {isFouledOut && " (OUT)"}
                    </Button>
                  );
                })}
            </Stack>
          </Box>
        )}

        {trackingMode === "OPPONENT" && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                display: "block",
                mb: 1,
                textTransform: "uppercase",
              }}
            >
              Opponent Jersey # (Optional)
            </Typography>
            <OpponentJerseyPicker
              selectedPlayerId={selectedPlayerId}
              setSelectedPlayerId={setSelectedPlayerId}
            />
            <OpponentBonusChip
              selectedPlayerId={selectedPlayerId}
              oppFouls={oppFouls}
              periodType={periodType}
            />
          </Box>
        )}

        {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
          trackingMode === "TEAM" &&
          team?.playbook &&
          team.playbook.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Offensive Play
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {team.playbook.map((play) => (
                  <Chip
                    key={play}
                    label={play}
                    size="small"
                    onClick={() => setPlayName(playName === play ? "" : play)}
                    color={playName === play ? "primary" : "default"}
                    variant={playName === play ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>
          )}

        {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Shot Quality
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {Object.values(SHOT_QUALITY).map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    size="small"
                    onClick={() => setShotQuality(shotQuality === q ? null : q)}
                    color={shotQuality === q ? "primary" : "default"}
                    variant={shotQuality === q ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Situation
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
                {Object.values(SITUATIONS).map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={() => setSituation(situation === s ? null : s)}
                    color={situation === s ? "primary" : "default"}
                    variant={situation === s ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            </Box>
          </>
        )}

        {statType === ACTION_TYPES.MAKE && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                display: "block",
                mb: 1,
                textTransform: "uppercase",
              }}
            >
              Points
            </Typography>
            <Stack direction="row" sx={{ gap: 0.5 }}>
              {[1, 2, 3].map((pt) => (
                <Button
                  key={pt}
                  variant={points === pt ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setPoints(pt)}
                  aria-label={`${pt} point shot`}
                  sx={{ minWidth: 40, fontWeight: 800 }}
                >
                  {pt}
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {(statType === ACTION_TYPES.MAKE || statType === ACTION_TYPES.MISS) &&
          trackingMode === "OPPONENT" && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  display: "block",
                  mb: 1,
                  textTransform: "uppercase",
                }}
              >
                Opponent Play Type
              </Typography>
              <ToggleButtonGroup
                value={opponentPlayType}
                exclusive
                onChange={(_, val) => setOpponentPlayType(val)}
                size="small"
                fullWidth
              >
                {["ISO", "P&R", "POST", "SPOT", "TRANSITION"].map((pt) => (
                  <ToggleButton
                    key={pt}
                    value={pt}
                    sx={{ fontSize: "var(--cs-typography-fontSize-xs)" }}
                  >
                    {pt}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}
      </DialogContent>
      <DialogActions>
        {selectedIsFouledOut && (
          <Typography variant="caption" color="error" sx={{ fontWeight: 800 }}>
            FOULED OUT: CANNOT RECORD ACTION
          </Typography>
        )}
        {clockSeconds === 0 && (
          <Typography variant="caption" color="error" sx={{ fontWeight: 800 }}>
            CLOCK AT 0:00: CANNOT RECORD ACTION
          </Typography>
        )}
        <Button onClick={onClose} disabled={isSavingStat}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave()}
          variant="contained"
          disabled={
            !selectedPlayerId ||
            !statType ||
            isSavingStat ||
            selectedIsFouledOut ||
            clockSeconds === 0
          }
        >
          {isSavingStat ? "Saving..." : isEditing ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
