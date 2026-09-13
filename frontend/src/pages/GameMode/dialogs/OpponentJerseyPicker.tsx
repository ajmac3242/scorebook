import React, { useState } from "react";
import { Stack, Button, TextField, Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";

type OpponentJerseyPickerProps = {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (_id: string) => void;
  opponentRoster?: string[];
  onQuickRegisterOpponentJersey?: (_jerseyNum: string) => void;
};

const DEFAULT_JERSEY_NUMBERS = [
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
  opponentRoster,
  onQuickRegisterOpponentJersey,
}) => {
  const tokens = useTokens();
  const [customJersey, setCustomJersey] = useState("");

  const jerseyList = React.useMemo(() => {
    if (opponentRoster && opponentRoster.length > 0) {
      const merged = Array.from(
        new Set([...opponentRoster, ...DEFAULT_JERSEY_NUMBERS]),
      );
      return merged.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
    }
    return DEFAULT_JERSEY_NUMBERS;
  }, [opponentRoster]);

  const handleQuickRegister = () => {
    const trimmed = customJersey.trim();
    if (!trimmed) return;
    const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${trimmed}`;
    if (onQuickRegisterOpponentJersey) {
      onQuickRegisterOpponentJersey(trimmed);
    } else {
      setSelectedPlayerId(oppId);
    }
    setCustomJersey("");
  };

  const isUnassignedCustom =
    customJersey.trim().length > 0 && !jerseyList.includes(customJersey.trim());

  return (
    <Box sx={{ mb: tokens.semantic.spacing.sm / 8 }}>
      <Stack
        direction="row"
        sx={{
          mb: tokens.semantic.spacing.xs / 8,
          flexWrap: "wrap",
          gap: tokens.semantic.spacing.xs / 8,
        }}
      >
        {jerseyList.map((num) => {
          const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${num}`;
          const isSelected = selectedPlayerId === oppId;
          return (
            <Button
              key={num}
              variant={isSelected ? "contained" : "outlined"}
              size="small"
              aria-pressed={isSelected}
              onClick={() =>
                setSelectedPlayerId(
                  isSelected ? SPECIAL_PLAYER_IDS.OPPONENT : oppId,
                )
              }
              sx={{
                minWidth: tokens.touch.targetComfortable,
                minHeight: tokens.touch.targetComfortable,
                fontWeight: tokens.typography.fontWeight.bold,
                borderColor: tokens.semantic.color.border.default,
              }}
            >
              {num}
            </Button>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Unassigned #"
          value={customJersey}
          onChange={(e) => setCustomJersey(e.target.value)}
          slotProps={{
            htmlInput: {
              "aria-label": "Unassigned opponent jersey number",
            },
          }}
          sx={{ width: 130 }}
        />
        {isUnassignedCustom && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={handleQuickRegister}
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              minHeight: tokens.touch.targetComfortable,
            }}
          >
            Quick-Register Jersey #{customJersey.trim()}
          </Button>
        )}
      </Stack>
    </Box>
  );
};
