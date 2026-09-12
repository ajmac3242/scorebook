import React from "react";
import { Stack, Button } from "@mui/material";
import { SPECIAL_PLAYER_IDS } from "../../../constants/stats";
import { useTokens } from "../../../theme/useTokens";

type OpponentJerseyPickerProps = {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (_id: string) => void;
  opponentRoster?: string[];
  onQuickRegisterJersey?: (_jersey: string) => void;
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
  onQuickRegisterJersey,
}) => {
  const tokens = useTokens();

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

  const [customJersey, setCustomJersey] = React.useState("");

  const handleQuickRegister = () => {
    const trimmed = customJersey.trim();
    if (!trimmed) return;
    const oppId = `${SPECIAL_PLAYER_IDS.OPPONENT}:${trimmed}`;
    if (onQuickRegisterJersey) {
      onQuickRegisterJersey(trimmed);
    } else {
      setSelectedPlayerId(oppId);
    }
    setCustomJersey("");
  };

  return (
    <Stack
      spacing={tokens.semantic.spacing.xs / 8}
      sx={{ mb: tokens.semantic.spacing.sm / 8 }}
    >
      <Stack
        direction="row"
        sx={{
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

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", pt: 0.5 }}>
        <input
          type="text"
          placeholder="Jersey #"
          value={customJersey}
          onChange={(e) => setCustomJersey(e.target.value)}
          aria-label="Custom opponent jersey number"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleQuickRegister();
            }
          }}
          style={{
            width: "80px",
            padding: "4px 8px",
            borderRadius: "4px",
            border: `1px solid ${tokens.semantic.color.border.default}`,
            fontSize: "12px",
          }}
        />
        {customJersey.trim() !== "" && (
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleQuickRegister}
            sx={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.bold,
            }}
          >
            Quick-Register Jersey #{customJersey.trim()}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};
