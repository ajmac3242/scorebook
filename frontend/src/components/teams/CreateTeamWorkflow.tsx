import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import WorkflowDialogShell from "../workflow/WorkflowDialogShell";
import { db, type Team } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { getInitials } from "../../utils/stats";

type CreateTeamWorkflowProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (team: Team) => void;
};

type TeamPeriodType = "QUARTERS" | "HALVES";

const DEFAULT_TEAM_ACCENT = "#154C56";
const STEPS = ["Details", "Branding", "Rules", "Review"] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const buildPreviewColors = (value?: string) => {
  const safe = isValidHex(value) ? value!.trim() : DEFAULT_TEAM_ACCENT;
  return {
    solid: safe,
    soft: `${safe}1F`,
    softer: `${safe}14`,
    border: `${safe}3D`,
  };
};

const CreateTeamWorkflow: React.FC<CreateTeamWorkflowProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState<TeamPeriodType>("QUARTERS");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_TEAM_ACCENT);
  const [fouls, setFouls] = useState<number>(3);
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewColors = useMemo(
    () => buildPreviewColors(primaryColor),
    [primaryColor],
  );

  const resetState = () => {
    setActiveStep(0);
    setTeamName("");
    setDescription("");
    setPeriodType("QUARTERS");
    setLogoUrl("");
    setPrimaryColor(DEFAULT_TEAM_ACCENT);
    setFouls(3);
    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const detailsValid = teamName.trim().length > 0;
  const brandingValid = isValidHex(primaryColor);
  const rulesValid = fouls > 0;
  const formValid = detailsValid && brandingValid && rulesValid;

  const validateStep = (step: number) => {
    if (step === 0) return detailsValid;
    if (step === 1) return brandingValid;
    if (step === 2) return rulesValid;
    return formValid;
  };

  const handleNext = () => {
    setShowValidation(true);
    setSubmitError("");

    if (!validateStep(activeStep)) return;
    setActiveStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setSubmitError("");
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const handleCreateTeam = async () => {
    setShowValidation(true);
    setSubmitError("");

    if (!formValid) return;

    setIsSubmitting(true);

    try {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName.trim(),
        description: description.trim(),
        periodType,
        logoUrl: logoUrl.trim(),
        primaryColor: isValidHex(primaryColor)
          ? primaryColor.trim()
          : DEFAULT_TEAM_ACCENT,
        fouls,
        synced: 0,
      };

      await db.teams.add(newTeam);
      await syncService.pushUpdates();
      onCreated?.(newTeam);
      resetState();
      onClose();
    } catch (err) {
      logger.error("Failed to add team", err, { teamName });
      setSubmitError("Failed to create team");
      setIsSubmitting(false);
    }
  };

  const renderDetailsStep = () => (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Team details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start with the basic information used throughout the app.
        </Typography>
      </Box>

      <TextField
        autoFocus
        label="Team name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        error={showValidation && !teamName.trim()}
        helperText={
          showValidation && !teamName.trim()
            ? "Team name is required"
            : "Shown in team lists, dashboards, and game setup."
        }
        fullWidth
      />

      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional short description"
        helperText="Useful for age group, program notes, or season context."
        fullWidth
        multiline
        minRows={3}
      />

      <FormControl fullWidth>
        <InputLabel id="team-period-type-label">Period type</InputLabel>
        <Select
          labelId="team-period-type-label"
          label="Period type"
          value={periodType}
          onChange={(e) =>
            setPeriodType(e.target.value as "QUARTERS" | "HALVES")
          }
        >
          <MenuItem value="QUARTERS">Quarters</MenuItem>
          <MenuItem value="HALVES">Halves</MenuItem>
        </Select>
        <FormHelperText>
          This becomes the default structure when creating games.
        </FormHelperText>
      </FormControl>
    </Stack>
  );

  const renderBrandingStep = () => (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Team branding
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add visual identity for cards, dashboards, and previews.
        </Typography>
      </Box>

      <TextField
        label="Logo URL"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://..."
        helperText="Optional. Leave blank to use team initials."
        fullWidth
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Primary color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          error={showValidation && !isValidHex(primaryColor)}
          helperText={
            showValidation && !isValidHex(primaryColor)
              ? "Use a valid hex color like #154C56"
              : "Used on the team card accent and quick visual cues."
          }
          fullWidth
        />

        <Box sx={{ minWidth: { xs: "100%", sm: 84 } }}>
          <TextField
            label="Color"
            type="color"
            value={isValidHex(primaryColor) ? primaryColor : DEFAULT_TEAM_ACCENT}
            onChange={(e) => setPrimaryColor(e.target.value)}
            fullWidth
            sx={{
              "& .MuiInputBase-root": {
                height: 56,
                p: 0.75,
                borderRadius: 2,
              },
              "& input": {
                p: 0,
                height: "100%",
                cursor: "pointer",
              },
            }}
          />
        </Box>
      </Stack>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ height: 6, bgcolor: previewColors.solid }} />
        <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: "center" }}>
          {logoUrl.trim() ? (
            <Avatar
              src={logoUrl.trim()}
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                border: `1px solid ${previewColors.border}`,
                bgcolor: previewColors.softer,
              }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: previewColors.soft,
                color: previewColors.solid,
                border: `1px solid ${previewColors.border}`,
                fontWeight: 700,
              }}
            >
              {getInitials(teamName || "Team")}
            </Avatar>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {teamName.trim() || "New team"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description.trim() || "No description yet."}
            </Typography>
            <Box sx={{ mt: 1.25 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "inline-flex",
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 999,
                  border: `1px solid ${previewColors.border}`,
                  bgcolor: previewColors.softer,
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                {periodType === "HALVES" ? "Halves" : "Quarters"}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );

  const renderRulesStep = () => (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Team defaults
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set defaults that carry into the team experience.
        </Typography>
      </Box>

      <FormControl fullWidth error={showValidation && fouls <= 0}>
        <TextField
          label="Team fouls to bonus"
          type="number"
          value={fouls}
          onChange={(e) => setFouls(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 1 } }}
          fullWidth
        />
        <FormHelperText>
          {showValidation && fouls <= 0
            ? "Fouls must be greater than 0"
            : "Used as the default foul threshold for this team."}
        </FormHelperText>
      </FormControl>
    </Stack>
  );

  const renderReviewStep = () => (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Review team
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirm the details before creating the team.
        </Typography>
      </Box>

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ height: 6, bgcolor: previewColors.solid }} />
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            {logoUrl.trim() ? (
              <Avatar
                src={logoUrl.trim()}
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  border: `1px solid ${previewColors.border}`,
                  bgcolor: previewColors.softer,
                }}
              />
            ) : (
              <Avatar
                variant="rounded"
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: previewColors.soft,
                  color: previewColors.solid,
                  border: `1px solid ${previewColors.border}`,
                  fontWeight: 700,
                }}
              >
                {getInitials(teamName || "Team")}
              </Avatar>
            )}

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {teamName.trim()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description.trim() || "No description yet."}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={1.25}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Period type
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {periodType === "HALVES" ? "Halves" : "Quarters"}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Primary color
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {primaryColor}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Fouls to bonus
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {fouls}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Logo
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, textAlign: "right" }}
              >
                {logoUrl.trim() ? "Custom logo URL" : "Initials avatar"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
    </Stack>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderDetailsStep();
      case 1:
        return renderBrandingStep();
      case 2:
        return renderRulesStep();
      case 3:
      default:
        return renderReviewStep();
    }
  };

  return (
    <WorkflowDialogShell
      open={open}
      onClose={handleClose}
      title="Create team"
      description="Build a team profile with identity, defaults, and game setup rules."
      steps={STEPS}
      activeStep={activeStep}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleCreateTeam}
      isSubmitting={isSubmitting}
      submitLabel="Create team"
      maxWidth="md"
    >
      {renderStepContent()}
    </WorkflowDialogShell>
  );
};

export default CreateTeamWorkflow;