import { keyframes } from "@mui/material";

export const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

export const slideBackAndForth = keyframes`
  0% { left: 0%; }
  50% { left: 70%; }
  100% { left: 0%; }
`;

export const batteryDrain = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;
