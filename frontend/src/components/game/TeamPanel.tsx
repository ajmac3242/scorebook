import React from "react";
import { Box, Typography, Avatar, Stack, Tooltip } from "@mui/material";
import { AnimatedNumber } from "../data-display/AnimatedNumber";
import TimeoutDots from "./TimeoutDots";
import { pulse } from "../../styles/animations";
import { useTokens } from "../../theme/useTokens";

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
  onScoreClick?: () => void;
  isReadOnly?: boolean;
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
  onScoreClick,
  isReadOnly = false,
}) => {
  const tokens = useTokens();
  const canClickScore = !isReadOnly && !!onScoreClick;

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
          alt={name}
          sx={{
            width: { xs: 36, sm: 56 },
            height: { xs: 36, sm: 56 },
            bgcolor: isOpponent
              ? tokens.semantic.color.brand.secondary.main
              : tokens.semantic.color.brand.primary.main,
            border: "2px solid rgba(255,255,255,0.2)",
            mb: 0.5,
          }}
        >
          {name.charAt(0)}
        </Avatar>
        <Typography
          variant="caption"
          sx={{
            color: tokens.semantic.color.text.inverse,
            fontWeight: tokens.typography.fontWeight.bold,
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
        <Tooltip title={canClickScore ? `Click to adjust ${name} score` : ""}>
          <Box
            onClick={canClickScore ? onScoreClick : undefined}
            role={canClickScore ? "button" : undefined}
            tabIndex={canClickScore ? 0 : -1}
            aria-label={`${name} score: ${score}.${canClickScore ? " Click to adjust score." : ""}`}
            onKeyDown={(e) => {
              if (canClickScore && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onScoreClick?.();
              }
            }}
            sx={{
              cursor: canClickScore ? "pointer" : "default",
              borderRadius: `${tokens.semantic.shape.radius.sm}px`,
              px: 1,
              mb: 1,
              transition: "background-color 0.2s, transform 0.1s",
              "&:hover": {
                bgcolor: canClickScore
                  ? "rgba(255, 255, 255, 0.1)"
                  : "transparent",
              },
              "&:focus-visible": {
                outline: "2px solid white",
                outlineOffset: "2px",
              },
            }}
          >
            <Typography
              sx={{
                color: tokens.semantic.color.text.inverse,
                fontSize: { xs: "2rem", sm: "3.5rem" },
                fontWeight: tokens.typography.fontWeight.black,
                lineHeight: 1,
              }}
              aria-live="polite"
            >
              <AnimatedNumber value={score} />
            </Typography>
          </Box>
        </Tooltip>
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
                          fontWeight: tokens.typography.fontWeight.bold,
                          color: isOut
                            ? tokens.semantic.color.feedback.error.main
                            : isDanger
                              ? tokens.semantic.color.feedback.warning.main
                              : tokens.semantic.color.text.tertiary,
                        }}
                      >
                        {pf.jersey}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: tokens.typography.fontWeight.black,
                          lineHeight: 1,
                          color: isOut
                            ? tokens.semantic.color.feedback.error.main
                            : isDanger
                              ? tokens.semantic.color.feedback.warning.main
                              : tokens.semantic.color.text.inverse,
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
              color: foulColor || tokens.semantic.color.text.inverse,
              fontWeight: tokens.typography.fontWeight.black,
              fontSize: { xs: "0.85rem", sm: "1.1rem" },
              textShadow: "0 0 10px rgba(0,0,0,0.5)",
              letterSpacing: 0.5,
            }}
          >
            FOULS: {fouls}
          </Typography>
          {bonusLabel ? (
            (() => {
              const isDoubleBonus =
                isDouble ||
                bonusLabel === "DBL BONUS" ||
                bonusLabel === "DOUBLE BONUS";
              const labelText = isDoubleBonus
                ? "DOUBLE BONUS"
                : bonusLabel === "DBL BONUS"
                  ? "DOUBLE BONUS"
                  : bonusLabel;
              return (
                <Box
                  role="status"
                  aria-label={`${name} ${isDoubleBonus ? "in double bonus" : "in bonus"}`}
                  data-testid={`${isOpponent ? "opp" : "team"}-bonus-indicator`}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 0.8,
                    py: 0.2,
                    borderRadius: `${tokens.semantic.shape.radius.sm}px`,
                    bgcolor: isDoubleBonus
                      ? tokens.semantic.color.feedback.error.main
                      : tokens.semantic.color.feedback.warning.main,
                    color: isDoubleBonus
                      ? tokens.semantic.color.text.inverse
                      : tokens.semantic.color.text.primary,
                    fontWeight: tokens.typography.fontWeight.black,
                    fontSize: "0.65rem",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    boxShadow: isDoubleBonus
                      ? `0 0 10px ${tokens.semantic.color.feedback.error.main}`
                      : `0 0 6px ${tokens.semantic.color.feedback.warning.main}`,
                    animation: isDoubleBonus
                      ? `${pulse} 2s infinite ease-in-out`
                      : "none",
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: isDoubleBonus
                        ? tokens.semantic.color.text.inverse
                        : tokens.semantic.color.text.primary,
                      boxShadow: "0 0 4px currentColor",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: tokens.typography.fontWeight.black,
                      fontSize: "0.65rem",
                      lineHeight: 1,
                    }}
                  >
                    {labelText}
                  </Typography>
                </Box>
              );
            })()
          ) : ftg > 0 ? (
            <Typography
              sx={{
                color: tokens.semantic.color.text.tertiary,
                fontWeight: tokens.typography.fontWeight.bold,
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
