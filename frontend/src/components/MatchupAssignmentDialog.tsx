import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
} from "@mui/material";
import { Player, Game } from "../db";
import { SPECIAL_PLAYER_IDS } from "../constants/stats";

interface MatchupAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  matchupOpponentId: string | null;
  game: Game | undefined;
  players: Player[];
  onCourtIds: Set<string>;
  currentMatchups: Map<string, string>;
  jerseyMap: Map<string, string>;
  getInitials: (name: string) => string;
  handleSaveMatchup: (defenderId: string) => void;
}

export const MatchupAssignmentDialog: React.FC<MatchupAssignmentDialogProps> = ({
  open,
  onClose,
  matchupOpponentId,
  game,
  players,
  onCourtIds,
  currentMatchups,
  jerseyMap,
  getInitials,
  handleSaveMatchup,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
        Assign Defender
        <Typography variant="body2" color="text.secondary">
          Who should guard {matchupOpponentId?.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":")
            ? `Opponent #${matchupOpponentId.split(":")[1]}`
            : (game?.opponent || "Opponent")}?
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            mt: 1,
          }}
        >
          {players
            .filter((p) => onCourtIds.has(p.id!))
            .map((p) => (
              <Button
                key={p.id}
                variant={currentMatchups.get(matchupOpponentId!) === p.id ? "contained" : "outlined"}
                onClick={() => handleSaveMatchup(p.id!)}
                sx={{ flexDirection: "column", py: 2 }}
              >
                <Avatar
                  sx={{
                    bgcolor: p.avatarColor || "grey.500",
                    width: 32,
                    height: 32,
                    fontSize: "0.8rem",
                    mb: 0.5,
                  }}
                >
                  {jerseyMap.get(p.id!) ?? getInitials(p.name)}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  {p.name.split(" ")[0]}
                </Typography>
              </Button>
            ))}
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => handleSaveMatchup("")}
            sx={{ flexDirection: "column", py: 2 }}
          >
            <Avatar sx={{ bgcolor: "transparent", border: "1px dashed grey", width: 32, height: 32, mb: 0.5, color: "text.secondary" }}>?</Avatar>
            <Typography variant="caption">None</Typography>
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
