import React from "react";
import { Box, Stack } from "@mui/material";

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
}) => (
  <Stack
    direction="row"
    spacing={0.5}
    alignItems="center"
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
            isActive
              ? `Timeout ${i + 1} remaining`
              : `Timeout ${i + 1} used`
          }
          sx={{
            width: { xs: 6, sm: 8 },
            height: { xs: 6, sm: 8 },
            borderRadius: "50%",
            bgcolor: isActive ? color : "transparent",
            border: `1.5px solid ${color}`,
            boxShadow: isActive ? `0 0 8px ${color}` : "none",
            transition: "all 0.3s ease",
          }}
        />
      );
    })}
  </Stack>
);

export default React.memo(TimeoutDots);
