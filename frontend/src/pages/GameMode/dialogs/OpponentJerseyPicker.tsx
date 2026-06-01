import React from "react";
import { Stack, Button } from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";

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
  return (
    <Stack direction="row" sx={{ mb: 1, flexWrap: "wrap", gap: 0.5 }}>
      {JERSEY_NUMBERS.map((num) => {
        const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
        return (
          <Button
            key={num}
            variant={selectedPlayerId === oppId ? "contained" : "outlined"}
            size="small"
            onClick={() =>
              setSelectedPlayerId(
                selectedPlayerId === oppId
                  ? SPECIAL_PLAYER_IDS.OPPONENT
                  : oppId,
              )
            }
            sx={{
              minWidth: 40,
              fontWeight: 700,
              borderColor: "var(--cs-semantic-color-border-default)",
            }}
          >
            {num}
          </Button>
        );
      })}
    </Stack>
  );
};
