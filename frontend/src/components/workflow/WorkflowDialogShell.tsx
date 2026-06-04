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
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 8);
  const isLastStep = activeStep === steps.length - 1;

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth={maxWidth}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: `${Math.max(
            tokens.semantic.component.radius.dialog,
            24,
          )}px`,
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ height: 4, bgcolor: "primary.main", flexShrink: 0 }} />

      <DialogTitle
        sx={{
          px: 3,
          pt: 3,
          pb: 1.5,
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 0 }}>
        <Stack spacing={3}>
          <WorkflowStepper steps={steps} activeStep={activeStep} />
          {children}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 3,
          mt: 1,
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={activeStep === 0 ? onClose : onBack}
          disabled={isSubmitting}
          startIcon={activeStep === 0 ? undefined : <ArrowBackIcon />}
          sx={{
            borderRadius: controlRadius,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {activeStep === 0 ? "Cancel" : "Back"}
        </Button>

        {!isLastStep ? (
          <Button
            variant="contained"
            onClick={onNext}
            disabled={isSubmitting}
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderRadius: controlRadius,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
            }}
          >
            {nextLabel}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
            endIcon={<CheckIcon />}
            sx={{
              borderRadius: controlRadius,
              textTransform: "none",
              fontWeight: 600,
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
