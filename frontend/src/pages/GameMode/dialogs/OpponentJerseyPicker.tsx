import React from "react";
import { Stack, Button } from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";

type OpponentJerseyPickerProps = {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (_id: string) => void;
};

const JERSEY_NUMBERS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "10",
  "11",
  "12",
  "23",
  "24",
  "30",
  "32",
  "33",
  "34",
  "35",
];

export const OpponentJerseyPicker: React.FC<OpponentJerseyPickerProps> = ({
  selectedPlayerId,
  setSelectedPlayerId,
}) => {
  const tokens = useTokens();

  return (
    <Stack
      direction="row"
      sx={{
        mb: tokens.semantic.spacing.sm / 8,
        flexWrap: "wrap",
        gap: tokens.semantic.spacing.xs / 8,
      }}
    >
      {JERSEY_NUMBERS.map((num) => {
        const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
        const isSelected = selectedPlayerId === oppId;
        return (
          <Button
            key={num}
            variant={isSelected ? "contained" : "outlined"}
            size="small"
            aria-label={`Select opponent jersey #${num}`}
            aria-pressed={isSelected}
            onClick={() =>
              setSelectedPlayerId(
                isSelected ? SPECIAL_PLAYER_IDS.OPPONENT : oppId,
              )
            }
            sx={{
              minWidth: 40,
              fontWeight: tokens.typography.fontWeight.bold,
              borderColor: tokens.semantic.color.border.default,
            }}
          >
            {num}
          </Button>
        );
      })}
    </Stack>
  );
};
