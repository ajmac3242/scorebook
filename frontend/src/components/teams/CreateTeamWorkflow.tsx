import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

type CreateTeamWorkflowProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (_team: Team) => void;
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
          sx={{ borderRadius: `${controlRadius}px`, p: 0.5 }}
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
          sx={{ borderRadius: `${controlRadius}px`, p: 0.5 }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

// ─── Main workflow component ───────────────────────────────────────────────────

const CreateTeamWorkflow: React.FC<CreateTeamWorkflowProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const tokens = useTokens();
  const defaultTeamAccent = tokens.semantic.color.brand.primary.dark;
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 12);

  const [activeStep, setActiveStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState<TeamPeriodType>("QUARTERS");
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

  const safePrimaryColor = useMemo(
    () => (isValidHex(primaryColor) ? primaryColor.trim() : defaultTeamAccent),
    [primaryColor, defaultTeamAccent],
  );

  const resetState = () => {
    setActiveStep(0);
    setTeamName("");
    setDescription("");
    setPeriodType("QUARTERS");
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
        primaryColor: safePrimaryColor,
        fouls: teamFoulsToBonus,
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
      resetState();
      onClose();
    } catch (err) {
      logger.error("Failed to add team", err, { teamName });
      setSubmitError("Failed to create team");
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

  // ─── Step renders ────────────────────────────────────────────────────────────

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
      />

      <TextField
        size="small"
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        helperText="Useful for age group, program notes, or season context."
        fullWidth
        multiline
        minRows={2}
      />

      {preview}
    </Stack>
  );

  const renderIdentityStep = () => (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Team identity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set a color and logo so your team stands out in lists and dashboards.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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

        <Box sx={{ minWidth: { xs: "100%", sm: 92 } }}>
          <TextField
            size="small"
            label="Color"
            type="color"
            value={safePrimaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            fullWidth
            sx={{
              "& .MuiInputBase-root": {
                height: 40,
                p: 0.5,
                borderRadius: `${controlRadius}px`,
              },
              "& input": { p: 0, height: "100%", cursor: "pointer" },
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
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Team rules
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure the defaults that shape games for this team.
        </Typography>
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel id="team-period-type-label">Period structure</InputLabel>
        <Select
          labelId="team-period-type-label"
          label="Period structure"
          value={periodType}
          onChange={(e) =>
            setPeriodType(e.target.value as "QUARTERS" | "HALVES")
          }
        >
          <MenuItem value="QUARTERS">Quarters</MenuItem>
          <MenuItem value="HALVES">Halves</MenuItem>
        </Select>
        <FormHelperText>
          This becomes the default game format for this team.
        </FormHelperText>
      </FormControl>

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

      <Stack spacing={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Timeout scope
        </Typography>
        <ToggleButtonGroup
          value={timeoutScope}
          exclusive
          onChange={(_, value) => {
            if (value) setTimeoutScope(value);
          }}
          aria-label="timeout scope"
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              py: 0.5,
              textTransform: "none",
              fontWeight: 600,
            },
          }}
        >
          <ToggleButton value="GAME" aria-label="timeouts per game">
            Per game
          </ToggleButton>
          <ToggleButton value="HALF" aria-label="timeouts per half">
            Per half
          </ToggleButton>
        </ToggleButtonGroup>
        <FormHelperText sx={{ ml: 0 }}>
          Whether the timeout count resets each half or applies to the full
          game.
        </FormHelperText>
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
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Review team
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirm the details before creating the team.
        </Typography>
      </Box>

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
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Description
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, textAlign: "right" }}
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
            Period structure
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {periodType === "HALVES" ? "Halves" : "Quarters"}
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
            {timeoutsPerTeam}{" "}
            {timeoutScope === "HALF" ? "per half" : "per game"}
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
      title="Create team"
      description="Build a team profile with identity, defaults, and game setup rules."
      steps={STEPS}
      activeStep={activeStep}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleCreateTeam}
      isSubmitting={isSubmitting}
      nextLabel="Continue"
      submitLabel="Create team"
      maxWidth="sm"
    >
      {activeStep === 0 && renderDetailsStep()}
      {activeStep === 1 && renderIdentityStep()}
      {activeStep === 2 && renderRulesStep()}
      {activeStep === 3 && renderReviewStep()}
    </WorkflowDialogShell>
  );
};

export default CreateTeamWorkflow;
