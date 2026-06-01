import React from "react";
import { Chip } from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../constants/stats";
import { useTokens } from "../../theme/useTokens";

/** Displays bonus/foul status chip for opponent when an opponent player is selected. */
export const OpponentBonusChip: React.FC<{
  selectedPlayerId: string | null;
  oppFouls: number;
  periodType: string;
}> = ({ selectedPlayerId, oppFouls, periodType }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tokens = useTokens();
  const pId = selectedPlayerId || "";
  const isOpp =
    pId === SPECIAL_PLAYER_IDS.OPPONENT ||
    pId.startsWith(SPECIAL_PLAYER_IDS.OPPONENT + ":");
  if (!isOpp) return null;
  const foulsRequired = periodType === "QUARTERS" ? 5 : 7;

  if (oppFouls >= foulsRequired)
    return (
      <Chip
        label="IN BONUS"
        size="small"
        sx={{
          bgcolor: "var(--cs-semantic-color-feedback-error-main)",
          color: "white",
          fontSize: "var(--cs-typography-fontSize-xs)",
        }}
      />
    );
  if (oppFouls === foulsRequired - 1)
    return (
      <Chip
        label="NEXT: BONUS"
        size="small"
        sx={{
          bgcolor: "var(--cs-semantic-color-feedback-warning-main)",
          color: "black",
          fontSize: "var(--cs-typography-fontSize-xs)",
        }}
      />
    );
  return null;
};
