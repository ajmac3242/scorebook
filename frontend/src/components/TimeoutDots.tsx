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
    {Array.from({ length: total }).map((_, i) => (
      <Box
        key={i}
        data-testid={i < count ? "timeout-dot-active" : "timeout-dot-inactive"}
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: i < count ? color : "rgba(255,255,255,0.2)",
          boxShadow: i < count ? `0 0 4px ${color}` : "none",
        }}
      />
    ))}
  </Stack>
);

export default React.memo(TimeoutDots);
