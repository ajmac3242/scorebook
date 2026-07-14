import React from "react";
import { Box, Typography, Avatar, Stack } from "@mui/material";
import { AnimatedNumber } from "../data-display/AnimatedNumber";
import TimeoutDots from "./TimeoutDots";
import { pulse } from "../../styles/animations";

export interface TeamPanelProps {
  name: string;
  logoUrl?: string;
  score: number;
  timeouts: number;
  timeoutTotal: number;
  isOpponent: boolean;
  fouls?: number;
  foulColor?: string;
  bonusLabel?: string;
  isDouble?: boolean;
  ftg?: number;
  onCourtFouls?: { jersey: string; fouls: number }[];
  foulLimit?: number;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({
  name,
  logoUrl,
  score,
  timeouts,
  timeoutTotal,
  isOpponent,
  fouls = 0,
  foulColor,
  bonusLabel,
  isDouble,
  ftg = 0,
  onCourtFouls = [],
  foulLimit = 5,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 3 },
        flexDirection: isOpponent ? "row-reverse" : "row",
      }}
    >
      {/* Logo & Name */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: { xs: 50, sm: 80 },
        }}
      >
        <Avatar
          src={logoUrl}
          sx={{
            width: { xs: 36, sm: 56 },
            height: { xs: 36, sm: 56 },
            bgcolor: isOpponent
              ? "var(--cs-semantic-color-brand-secondary-main)"
              : "var(--cs-semantic-color-brand-primary-main)",
            border: "2px solid rgba(255,255,255,0.2)",
            mb: 0.5,
          }}
        >
          {name.charAt(0)}
        </Avatar>
        <Typography
          variant="caption"
          sx={{
            color: "var(--cs-semantic-color-text-inverse)",
            fontWeight: "var(--cs-typography-fontWeight-bold)",
            fontSize: { xs: "0.6rem", sm: "0.8rem" },
            textTransform: "uppercase",
            letterSpacing: 1,
            textAlign: "center",
            maxWidth: { xs: 60, sm: 100 },
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
      </Box>

      {/* Score & Timeouts */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            color: "var(--cs-semantic-color-text-inverse)",
            fontSize: { xs: "2rem", sm: "3.5rem" },
            fontWeight: 900,
            lineHeight: 1,
            mb: 1,
          }}
          aria-live="polite"
          aria-label={`${name} score: ${score}`}
        >
          <AnimatedNumber value={score} />
        </Typography>
        <TimeoutDots
          count={timeouts}
          total={timeoutTotal}
          data-testid={isOpponent ? "opp-timeout-dots" : "team-timeout-dots"}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mt: 0.5, minHeight: 24 }}
        >
          {/* Foul Strip */}
          {onCourtFouls.length > 0 && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                mr: isOpponent ? 0 : 1,
                ml: isOpponent ? 1 : 0,
                flexDirection: isOpponent ? "row-reverse" : "row",
              }}
            >
              {onCourtFouls
                .sort((a, b) => {
                  const nA = parseInt(a.jersey, 10);
                  const nB = parseInt(b.jersey, 10);
                  if (isNaN(nA) || isNaN(nB))
                    return a.jersey.localeCompare(b.jersey);
                  return nA - nB;
                })
                .map((pf) => {
                  const isDanger = pf.fouls >= foulLimit - 1;
                  const isOut = pf.fouls >= foulLimit;
                  return (
                    <Box
                      key={pf.jersey}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: 20,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          color: isOut
                            ? "var(--cs-semantic-color-feedback-error-main)"
                            : isDanger
                              ? "var(--cs-semantic-color-feedback-warning-main)"
                              : "var(--cs-semantic-color-text-tertiary)",
                        }}
                      >
                        {pf.jersey}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 900,
                          lineHeight: 1,
                          color: isOut
                            ? "var(--cs-semantic-color-feedback-error-main)"
                            : isDanger
                              ? "var(--cs-semantic-color-feedback-warning-main)"
                              : "var(--cs-semantic-color-text-inverse)",
                          animation: isDanger ? `${pulse} 2s infinite` : "none",
                        }}
                      >
                        {pf.fouls}
                      </Typography>
                    </Box>
                  );
                })}
            </Stack>
          )}

          <Typography
            sx={{
              color: foulColor || "var(--cs-semantic-color-text-inverse)",
              fontWeight: 900,
              fontSize: { xs: "0.85rem", sm: "1.1rem" },
              textShadow: "0 0 10px rgba(0,0,0,0.5)",
              letterSpacing: 0.5,
            }}
          >
            FOULS: {fouls}
          </Typography>
          {bonusLabel ? (
            <Typography
              sx={{
                color: "var(--cs-semantic-color-feedback-warning-main)",
                fontWeight: 900,
                fontSize: "0.7rem",
                letterSpacing: 1,
                animation: isDouble
                  ? `${pulse} 2s infinite ease-in-out`
                  : "none",
              }}
            >
              {bonusLabel}
            </Typography>
          ) : ftg > 0 ? (
            <Typography
              sx={{
                color: "var(--cs-semantic-color-text-tertiary)",
                fontWeight: "var(--cs-typography-fontWeight-bold)",
                fontSize: "0.6rem",
                letterSpacing: 0.5,
                opacity: 0.8,
              }}
            >
              FTG: {ftg}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
};
