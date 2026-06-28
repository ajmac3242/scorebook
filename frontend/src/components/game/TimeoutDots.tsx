import React from "react";
import { Box, Stack } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

/**
 * Visual indicator for timeouts left using dots.
 */
interface TimeoutDotsProps {
  count: number;
  total?: number;
  color?: string;
  "data-testid"?: string;
}

const TimeoutDots: React.FC<TimeoutDotsProps> = ({
  count,
  total = 5,
  color = "white",
  "data-testid": testId,
}) => {
  const tokens = useTokens();
  return (
    <Stack
    direction="row"
    spacing={0.5}
    sx={{ alignItems: "center" }}
    data-testid={testId}
    role="img"
    aria-label={`${count} timeouts remaining`}
    aria-live="polite"
  >
    {Array.from({ length: total }).map((_, i) => {
      // In the new design:
      // Filled dots = remaining timeouts
      // Empty dots = used timeouts
      // count is TOL (Timeouts Left)
      // Dots from 0 to count-1 should be filled
      const isActive = i < count;

      return (
        <Box
          key={i}
          data-testid={isActive ? "timeout-dot-active" : "timeout-dot-inactive"}
          role="img"
          aria-label={
            isActive ? `Timeout ${i + 1} remaining` : `Timeout ${i + 1} used`
          }
          sx={{
            width: { xs: 6, sm: 8 },
            height: { xs: 6, sm: 8 },
            borderRadius: "50%",
            bgcolor: isActive ? color : "transparent",
            border: `1.5px solid ${color}`,
            boxShadow: isActive ? `0 0 8px ${color}` : "none",
            transition: `all ${tokens.motion.duration.normal} ${tokens.motion.easing.productive}`,
          }}
        />
        );
      })}
    </Stack>
  );
};

export default React.memo(TimeoutDots);
