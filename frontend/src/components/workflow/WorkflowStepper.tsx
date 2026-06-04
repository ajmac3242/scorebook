import React from "react";
import { Box, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

type WorkflowStepperProps = {
  steps: readonly string[];
  activeStep: number;
};

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  activeStep,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" sx={{ alignItems: "flex-start" }}>
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const showConnector = index < steps.length - 1;

          return (
            <React.Fragment key={step}>
              <Stack
                spacing={1}
                sx={{
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid",
                    borderColor:
                      isCompleted || isActive ? "primary.main" : "divider",
                    bgcolor:
                      isCompleted || isActive
                        ? "primary.main"
                        : "background.paper",
                    color:
                      isCompleted || isActive
                        ? "primary.contrastText"
                        : "text.secondary",
                    boxShadow: isActive
                      ? `0 0 0 4px ${tokens.semantic.color.action.focusRing}`
                      : "none",
                    transition: theme.transitions.create(
                      [
                        "background-color",
                        "border-color",
                        "box-shadow",
                        "color",
                      ],
                      { duration: theme.transitions.duration.shorter },
                    ),
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? (
                    <CheckIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight:
                          tokens.semantic.typography.button.fontWeight,
                        color: "inherit",
                        lineHeight: 1,
                      }}
                    >
                      {index + 1}
                    </Typography>
                  )}
                </Box>

                {!isMobile ? (
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      color: isActive
                        ? "primary.main"
                        : isCompleted
                          ? "text.secondary"
                          : "text.disabled",
                      fontWeight: isActive
                        ? tokens.semantic.typography.button.fontWeight
                        : tokens.semantic.typography.caption.fontWeight,
                      maxWidth: 88,
                      lineHeight: 1.3,
                    }}
                  >
                    {step}
                  </Typography>
                ) : null}
              </Stack>

              {showConnector ? (
                <Box
                  sx={{
                    flex: 1,
                    mt: 1.75,
                    mx: 1,
                    borderTop: "2px dashed",
                    borderColor:
                      index < activeStep ? "primary.main" : "divider",
                    minWidth: 12,
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};

export default WorkflowStepper;
