import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";
import WorkflowStepper from "./WorkflowStepper";

type WorkflowDialogShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  steps: readonly string[];
  activeStep: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
};

const WorkflowDialogShell: React.FC<WorkflowDialogShellProps> = ({
  open,
  onClose,
  title,
  description,
  steps,
  activeStep,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  nextLabel = "Continue",
  submitLabel = "Create",
  maxWidth = "md",
  children,
}) => {
  const tokens = useTokens();
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 12);
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby="workflow-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: `${Math.max(
            tokens.semantic.component.radius.dialog,
            24,
          )}px`,
          overflow: "hidden",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          bgcolor: tokens.semantic.color.brand.primary.main,
          flexShrink: 0,
        }}
      />

      <DialogTitle
        id="workflow-dialog-title"
        sx={{
          px: 3,
          pt: 3,
          pb: 1.5,
          flexShrink: 0,
        }}
      >
        <Stack spacing={1}>
          <Typography
            variant="h5"
            sx={{ fontWeight: tokens.typography.fontWeight.bold }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body2"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              {description}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 3,
          pt: 2,
          pb: 0,
          overflowY: "auto",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Stack spacing={3}>
          <WorkflowStepper steps={steps} activeStep={activeStep} />

          <Box
            key={activeStep}
            sx={{
              animation:
                "stepContentIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
              "@keyframes stepContentIn": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            {children}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 3,
          mt: 1,
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Button
          size="small"
          onClick={activeStep === 0 ? onClose : onBack}
          disabled={isSubmitting}
          startIcon={activeStep === 0 ? undefined : <ArrowBackIcon />}
          sx={{
            borderRadius: `${controlRadius}px`,
            textTransform: "none",
            fontWeight: tokens.typography.fontWeight.semibold,
          }}
        >
          {activeStep === 0 ? "Cancel" : "Back"}
        </Button>

        {!isLastStep ? (
          <Button
            size="small"
            variant="contained"
            onClick={onNext}
            disabled={isSubmitting}
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: `${controlRadius}px`,
              textTransform: "none",
              fontWeight: tokens.typography.fontWeight.semibold,
              boxShadow: "none",
            }}
          >
            {nextLabel}
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
            endIcon={<CheckIcon />}
            sx={{
              borderRadius: `${controlRadius}px`,
              textTransform: "none",
              fontWeight: tokens.typography.fontWeight.semibold,
              boxShadow: "none",
            }}
          >
            {isSubmitting ? "Creating..." : submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkflowDialogShell;
