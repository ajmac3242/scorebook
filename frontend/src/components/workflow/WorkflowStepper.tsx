import React from "react";
import {
  Box,
  GlobalStyles,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
      <GlobalStyles
        styles={{
          "@keyframes stepperPulse": {
            "0%": {
              boxShadow:
                "0 0 0 0px var(--stepper-pulse-color, rgba(0,0,0,0.15))",
            },
            "70%": { boxShadow: "0 0 0 6px transparent" },
            "100%": { boxShadow: "0 0 0 0px transparent" },
          },
          "@keyframes stepperCheckIn": {
            from: { opacity: 0, transform: "scale(0.4) rotate(-15deg)" },
            to: { opacity: 1, transform: "scale(1) rotate(0deg)" },
          },
          "@keyframes stepperLineFill": {
            from: { transform: "scaleX(0)" },
            to: { transform: "scaleX(1)" },
          },
        }}
      />

      <Stack direction="row" sx={{ alignItems: "flex-start" }}>
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const showConnector = index < steps.length - 1;
          const connectorFilled = index < activeStep;

          return (
            <React.Fragment key={step}>
              {/* Step node */}
              <Stack
                spacing={0.75}
                sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
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
                    flexShrink: 0,
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color"],
                      { duration: theme.transitions.duration.standard },
                    ),
                    // Active pulse ring
                    ...(isActive && {
                      "--stepper-pulse-color":
                        tokens.semantic.color.action.focusRing,
                      animation: "stepperPulse 2s ease-out infinite",
                    }),
                  }}
                >
                  {isCompleted ? (
                    <CheckIcon
                      sx={{
                        fontSize: 15,
                        animation:
                          "stepperCheckIn 220ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                      }}
                    />
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight:
                          tokens.semantic.typography.button.fontWeight,
                        color: "inherit",
                        lineHeight: 1,
                        fontSize: 11,
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
                      maxWidth: 80,
                      lineHeight: 1.3,
                      transition: theme.transitions.create("color", {
                        duration: theme.transitions.duration.short,
                      }),
                    }}
                  >
                    {step}
                  </Typography>
                ) : null}
              </Stack>

              {/* Connector */}
              {showConnector ? (
                <Box
                  sx={{
                    flex: 1,
                    mt: 1.625,
                    mx: 0.5,
                    minWidth: 12,
                    height: "2px",
                    bgcolor: "divider",
                    borderRadius: "1px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Filled overlay — animates in on completion */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: "primary.main",
                      borderRadius: "1px",
                      transformOrigin: "left center",
                      transform: connectorFilled ? "scaleX(1)" : "scaleX(0)",
                      transition: theme.transitions.create("transform", {
                        duration: theme.transitions.duration.standard,
                        easing: theme.transitions.easing.easeInOut,
                      }),
                    }}
                  />
                </Box>
              ) : null}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};

export default WorkflowStepper;
