import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import WorkflowDialogShell from "../workflow/WorkflowDialogShell";
import { db, type Team } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { useTokens } from "../../theme/useTokens";
import TeamIdentityPreview from "./TeamIdentityPreview";

export type TeamWorkflowDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  team?: Team;
  teamId?: string;
  onCreated?: (_team: Team) => void;
  onSuccess?: (_message: string) => void;
  onError?: (_message: string) => void;
};

type TeamPeriodType = "QUARTERS" | "HALVES";
type TimeoutScope = "HALF" | "GAME";

const STEPS = ["Details", "Identity", "Rules", "Review"] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

// ─── Compact inline stepper control ───────────────────────────────────────────

type StepperFieldProps = {
  label: string;
  value: number;
  onChange: (_value: number) => void;
  helperText: string;
  min?: number;
  max?: number;
};

const StepperField: React.FC<StepperFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  min = 0,
  max = 99,
}) => {
  const tokens = useTokens();
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 8);

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${controlRadius}px`,
          bgcolor: "background.paper",
          flexShrink: 0,
        }}
      >
        <IconButton
          aria-label={`decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            p: 0.5,
            color: value <= min ? "text.disabled" : "text.primary",
          }}
        >
          <RemoveIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            minWidth: 28,
            textAlign: "center",
            userSelect: "none",
          }}
        >
          {value}
        </Typography>
        <IconButton
          aria-label={`increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            p: 0.5,
            color: value >= max ? "text.disabled" : "text.primary",
          }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

// ─── Main workflow component ───────────────────────────────────────────────────

const TeamWorkflowDialog: React.FC<TeamWorkflowDialogProps> = ({
  open,
  onClose,
  mode,
  team,
  teamId,
  onCreated,
  onSuccess,
  onError,
}) => {
  const tokens = useTokens();
  const defaultTeamAccent = tokens.semantic.color.brand.primary.dark;
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 12);

  const [activeStep, setActiveStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState<TeamPeriodType>("QUARTERS");
  const [periodDuration, setPeriodDuration] = useState<number>(10);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState(defaultTeamAccent);
  const [foulsToFoulOut, setFoulsToFoulOut] = useState<number>(5);
  const [teamFoulsToBonus, setTeamFoulsToBonus] = useState<number>(7);
  const [teamFoulsToDoubleBonus, setTeamFoulsToDoubleBonus] =
    useState<number>(10);
  const [timeoutsPerTeam, setTimeoutsPerTeam] = useState<number>(5);
  const [timeoutScope, setTimeoutScope] = useState<TimeoutScope>("GAME");
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seed state from existing team when opening in edit mode
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(false);

    if (mode === "edit" && team) {
      setTeamName(team.name || "");
      setDescription(team.description || "");
      setLogoUrl(team.logoUrl || "");
      setPrimaryColor(team.primaryColor || defaultTeamAccent);
      setPeriodType(team.periodType || "QUARTERS");
      setPeriodDuration(
        team.defaultPeriodLength ||
          (team.periodType === "HALVES" ? 20 : 10),
      );
      setFoulsToFoulOut(team.defaultFoulLimit || team.foulsToFoulOut || 5);
      setTeamFoulsToBonus(team.teamFoulsToBonus || 7);
      setTeamFoulsToDoubleBonus(team.teamFoulsToDoubleBonus || 10);
      setTimeoutsPerTeam(
        team.defaultTimeoutLimit || team.timeoutsPerTeam || 5,
      );
      setTimeoutScope(team.timeoutScope || "GAME");
    } else {
      setTeamName("");
      setDescription("");
      setLogoUrl("");
      setPrimaryColor(defaultTeamAccent);
      setPeriodType("QUARTERS");
      setPeriodDuration(10);
      setFoulsToFoulOut(5);
      setTeamFoulsToBonus(7);
      setTeamFoulsToDoubleBonus(10);
      setTimeoutsPerTeam(5);
      setTimeoutScope("GAME");
    }
  }, [open, mode, team, defaultTeamAccent]);

  const safePrimaryColor = useMemo(
    () => (isValidHex(primaryColor) ? primaryColor.trim() : defaultTeamAccent),
    [primaryColor, defaultTeamAccent],
  );

  const resetState = () => {
    setActiveStep(0);
    setTeamName("");
    setDescription("");
    setPeriodType("QUARTERS");
    setPeriodDuration(10);
    setLogoUrl("");
    setPrimaryColor(defaultTeamAccent);
    setFoulsToFoulOut(5);
    setTeamFoulsToBonus(7);
    setTeamFoulsToDoubleBonus(10);
    setTimeoutsPerTeam(5);
    setTimeoutScope("GAME");
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
  const identityValid = isValidHex(primaryColor);
  const rulesValid =
    foulsToFoulOut > 0 &&
    teamFoulsToBonus > 0 &&
    teamFoulsToDoubleBonus >= teamFoulsToBonus &&
    timeoutsPerTeam > 0;
  const formValid = detailsValid && identityValid && rulesValid;

  const validateStep = (step: number) => {
    if (step === 0) return detailsValid;
    if (step === 1) return identityValid;
    if (step === 2) return rulesValid;
    return formValid;
  };

  const handleNext = () => {
    setShowValidation(true);
    setSubmitError("");
    if (!validateStep(activeStep)) return;
    setActiveStep((c) => Math.min(c + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setSubmitError("");
    setActiveStep((c) => Math.max(c - 1, 0));
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    setSubmitError("");
    if (!formValid) return;
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const newTeam: Team = {
          id: crypto.randomUUID(),
          name: teamName.trim(),
          description: description.trim(),
          periodType,
          logoUrl: logoUrl.trim(),
          primaryColor: safePrimaryColor,
          foulsToFoulOut,
          teamFoulsToBonus,
          teamFoulsToDoubleBonus,
          timeoutsPerTeam,
          timeoutScope,
          defaultFoulLimit: foulsToFoulOut,
          defaultTimeoutLimit: timeoutsPerTeam,
          synced: 0,
        };
        await db.teams.add(newTeam);
        await syncService.pushUpdates();
        onCreated?.(newTeam);
        onSuccess?.("Team created successfully!");
      } else {
        const resolvedId = teamId ?? team?.id;
        if (!resolvedId) throw new Error("Missing team id");
        await db.teams.update(resolvedId, {
          name: teamName.trim(),
          description: description.trim(),
          logoUrl: logoUrl.trim(),
          primaryColor: safePrimaryColor,
          periodType,
          defaultPeriodLength: periodDuration,
          defaultFoulLimit: foulsToFoulOut,
          foulsToFoulOut,
          teamFoulsToBonus,
          teamFoulsToDoubleBonus,
          defaultTimeoutLimit: timeoutsPerTeam,
          timeoutsPerTeam,
          timeoutScope,
          synced: 0,
        });
        await syncService.pushUpdates();
        onSuccess?.("Team settings updated.");
      }

      resetState();
      onClose();
    } catch (err) {
      logger.error(`Failed to ${mode} team`, err, { teamName });
      const message =
        mode === "create" ? "Failed to create team" : "Failed to update team settings";
      setSubmitError(message);
      onError?.(message);
      setIsSubmitting(false);
    }
  };

  // Shared preview used across Details, Identity, and Review
  const preview = (
    <TeamIdentityPreview
      teamName={teamName}
      description={description}
      logoUrl={logoUrl}
      primaryColor={safePrimaryColor}
    />
  );

  const title = mode === "create" ? "Create team" : "Edit team";
  const description_ =
    mode === "create"
      ? "Build a team profile with identity, defaults, and game setup rules."
      : "Update team identity, defaults, and game setup rules.";
  const submitLabel = mode === "create" ? "Create team" : "Save changes";

  // ─── Step renders ────────────────────────────────────────────────────────────

  const renderDetailsStep = () => (
    <Stack spacing={3}>
      <TextField
        autoFocus
        size="small"
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
        slotProps={{
          formHelperText: { sx: { color: "text.secondary" } },
        }}
      />

      <TextField
        size="small"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        helperText="Useful for age group, program notes, or season context."
        fullWidth
        slotProps={{
          formHelperText: { sx: { color: "text.secondary" } },
        }}
      />

      {preview}
    </Stack>
  );

  const renderIdentityStep = () => (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <TextField
          size="small"
          label="Primary color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          error={showValidation && !isValidHex(primaryColor)}
          helperText={
            showValidation && !isValidHex(primaryColor)
              ? "Use a valid hex color like #154C56"
              : "Used on team cards, headers, and quick visual cues."
          }
          fullWidth
        />

        <Box
          sx={{
            width: 56,
            height: 40,
            borderRadius: `${controlRadius}px`,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
            bgcolor: safePrimaryColor,
            mt: 1,
          }}
        >
          <Box
            component="input"
            aria-label="Team color"
            type="color"
            value={safePrimaryColor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPrimaryColor(e.target.value)
            }
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              p: 0,
              m: 0,
              border: 0,
              cursor: "pointer",
              opacity: 0,
            }}
          />
        </Box>
      </Stack>

      <TextField
        size="small"
        label="Logo URL"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://..."
        helperText="Optional. Leave blank to use team initials."
        fullWidth
      />

      {preview}
    </Stack>
  );

  const renderRulesStep = () => (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
        Period
      </Typography>

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0, pr: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Period format
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Quarters or halves as the default game format.
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={periodType}
          exclusive
          onChange={(_, value) => {
            if (value) setPeriodType(value);
          }}
          aria-label="period format"
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              borderRadius: 0,
              "&:not(:last-of-type)": {
                borderRight: "1px solid",
                borderColor: "divider",
              },
            },
            "& .MuiToggleButton-root": {
              flex: 1,
              px: 2,
              py: 0.75,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.8125rem",
              color: "text.secondary",
              lineHeight: 1.5,
            },
            "& .MuiToggleButton-root.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            },
            "& .MuiToggleButton-root:hover:not(.Mui-selected)": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ToggleButton value="QUARTERS" aria-label="quarters format">
            Quarters
          </ToggleButton>
          <ToggleButton value="HALVES" aria-label="halves format">
            Halves
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <StepperField
        label="Period duration"
        value={periodDuration}
        onChange={setPeriodDuration}
        helperText="Default length of each period in minutes."
        min={1}
        max={20}
      />

      <Divider />

      <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
        Fouls
      </Typography>

      <StepperField
        label="Personal fouls to foul out"
        value={foulsToFoulOut}
        onChange={setFoulsToFoulOut}
        helperText="Players foul out at this count."
        min={1}
        max={10}
      />

      <StepperField
        label="Team fouls to bonus"
        value={teamFoulsToBonus}
        onChange={(value) => {
          setTeamFoulsToBonus(value);
          if (teamFoulsToDoubleBonus < value) setTeamFoulsToDoubleBonus(value);
        }}
        helperText="Bonus free throws begin at this count."
        min={1}
        max={20}
      />

      <StepperField
        label="Team fouls to double bonus"
        value={teamFoulsToDoubleBonus}
        onChange={(value) =>
          setTeamFoulsToDoubleBonus(Math.max(teamFoulsToBonus, value))
        }
        helperText="Automatic two-shot bonus at this count."
        min={teamFoulsToBonus}
        max={20}
      />

      <Divider />

      <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
        Timeouts
      </Typography>

      <StepperField
        label="Timeouts per team"
        value={timeoutsPerTeam}
        onChange={setTimeoutsPerTeam}
        helperText="Default timeout count per team."
        min={1}
        max={12}
      />

      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Box sx={{ minWidth: 0, pr: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Timeout reset
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Whether timeout count resets each half or applies to the game.
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={timeoutScope}
          exclusive
          onChange={(_, value) => {
            if (value) setTimeoutScope(value);
          }}
          aria-label="timeout reset"
          size="small"
          sx={{
            borderRadius: `${controlRadius}px`,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            "& .MuiToggleButtonGroup-grouped": {
              border: 0,
              borderRadius: 0,
              "&:not(:last-of-type)": {
                borderRight: "1px solid",
                borderColor: "divider",
              },
            },
            "& .MuiToggleButton-root": {
              flex: 1,
              px: 2,
              py: 0.75,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.8125rem",
              color: "text.secondary",
              lineHeight: 1.5,
            },
            "& .MuiToggleButton-root.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            },
            "& .MuiToggleButton-root:hover:not(.Mui-selected)": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ToggleButton value="GAME" aria-label="timeouts per game">
            Game
          </ToggleButton>
          <ToggleButton value="HALF" aria-label="timeouts per half">
            Half
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {showValidation && teamFoulsToDoubleBonus < teamFoulsToBonus ? (
        <Alert severity="error">
          Double bonus must be ≥ the bonus threshold.
        </Alert>
      ) : null}
    </Stack>
  );

  const renderReviewStep = () => (
    <Stack spacing={2.5}>
      {preview}

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">
          Details
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Team name
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {teamName.trim()}
          </Typography>
        </Stack>
        {description.trim() ? (
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", gap: 2 }}
          >
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "right" }}
            >
              {description.trim()}
            </Typography>
          </Stack>
        ) : null}
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">
          Identity
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Primary color
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {safePrimaryColor}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Logo
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {logoUrl.trim() ? "Custom logo URL" : "Initials avatar"}
          </Typography>
        </Stack>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="overline" color="text.secondary">
          Rules
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Period format
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {periodType === "HALVES" ? "Halves" : "Quarters"}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Period duration
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {`${periodDuration} min`}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Fouls to foul out
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {foulsToFoulOut}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Fouls to bonus
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {teamFoulsToBonus}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Fouls to double bonus
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {teamFoulsToDoubleBonus}
          </Typography>
        </Stack>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            Timeouts
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {`${timeoutsPerTeam} ${timeoutScope === "HALF" ? "per half" : "per game"}`}
          </Typography>
        </Stack>
      </Stack>

      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
    </Stack>
  );

  return (
    <WorkflowDialogShell
      open={open}
      onClose={handleClose}
      title={title}
      description={description_}
      steps={STEPS}
      activeStep={activeStep}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      nextLabel="Continue"
      submitLabel={submitLabel}
      maxWidth="sm"
    >
      {activeStep === 0 && renderDetailsStep()}
      {activeStep === 1 && renderIdentityStep()}
      {activeStep === 2 && renderRulesStep()}
      {activeStep === 3 && renderReviewStep()}
    </WorkflowDialogShell>
  );
};

export default TeamWorkflowDialog;
