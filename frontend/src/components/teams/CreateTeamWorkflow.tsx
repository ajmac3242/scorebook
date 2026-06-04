import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Divider,
  FormControl,
  FormControlLabel,
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
import {
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import WorkflowDialogShell from "../workflow/WorkflowDialogShell";
import { db, type Team } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { getInitials } from "../../utils/stats";
import { useTokens } from "../../theme/useTokens";

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

const buildPreviewColors = (value: string) => ({
  solid: value,
  soft: `${value}1F`,
  softer: `${value}14`,
  border: `${value}3D`,
});

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
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${controlRadius}px`,
          px: 1,
          py: 0.75,
          bgcolor: "background.paper",
        }}
      >
        <IconButton
          aria-label={`decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          size="small"
          sx={{ borderRadius: `${controlRadius}px` }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <IconButton
          aria-label={`increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          size="small"
          sx={{ borderRadius: `${controlRadius}px` }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        {helperText}
      </Typography>
    </Stack>
  );
};

const CreateTeamWorkflow: React.FC<CreateTeamWorkflowProps> = ({
  open,
  onClose,
  onCreated,
}) => {
  const tokens = useTokens();
  const defaultTeamAccent = tokens.semantic.color.brand.primary.dark;
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 8);

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

  const safePrimaryColor = isValidHex(primaryColor)
    ? primaryColor.trim()
    : defaultTeamAccent;

  const previewColors = useMemo(
    () => buildPreviewColors(safePrimaryColor),
    [safePrimaryColor],
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
        minRows={3}
      />
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

      <TextField
        size="small"
        label="Logo URL"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://..."
        helperText="Optional. Leave blank to use team initials."
        fullWidth
      />

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
        <Stack
          direction="row"
          spacing={2}
          sx={{ p: 2.5, alignItems: "center" }}
        >
          {logoUrl.trim() ? (
            <Avatar
              src={logoUrl.trim()}
              variant="rounded"
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${controlRadius}px`,
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
                borderRadius: `${controlRadius}px`,
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
          </Box>
        </Stack>
      </Box>
    </Stack>
  );

  const renderRulesStep = () => (
    <Stack spacing={2.5}>
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

      <StepperField
        label="Personal fouls to foul out"
        value={foulsToFoulOut}
        onChange={setFoulsToFoulOut}
        helperText="Players foul out after reaching this number of personal fouls."
        min={1}
        max={10}
      />

      <StepperField
        label="Team fouls to bonus"
        value={teamFoulsToBonus}
        onChange={(value) => {
          setTeamFoulsToBonus(value);
          if (teamFoulsToDoubleBonus < value) {
            setTeamFoulsToDoubleBonus(value);
          }
        }}
        helperText="The team enters the bonus when it reaches this foul count."
        min={1}
        max={20}
      />

      <StepperField
        label="Team fouls to double bonus"
        value={teamFoulsToDoubleBonus}
        onChange={(value) =>
          setTeamFoulsToDoubleBonus(Math.max(teamFoulsToBonus, value))
        }
        helperText="Automatic two-shot bonus begins at this foul count."
        min={teamFoulsToBonus}
        max={20}
      />

      <Stack spacing={1.5}>
        <StepperField
          label="Timeouts per team"
          value={timeoutsPerTeam}
          onChange={setTimeoutsPerTeam}
          helperText="Default timeout count available to each team."
          min={1}
          max={12}
        />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Timeout scope
          </Typography>
          <ToggleButtonGroup
            value={timeoutScope}
            exclusive
            onChange={(_, value) => {
              if (value) setTimeoutScope(value);
            }}
            aria-label="timeout scope"
            sx={{
              borderRadius: `${controlRadius}px`,
              "& .MuiToggleButton-root": {
                px: 2,
                py: 0.75,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: `${controlRadius}px !important`,
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
            Choose whether the timeout count resets each half or applies to the full game.
          </FormHelperText>
        </Box>
      </Stack>

      {showValidation && teamFoulsToDoubleBonus < teamFoulsToBonus ? (
        <Alert severity="error">
          Double bonus must be greater than or equal to the bonus threshold.
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
                  borderRadius: `${controlRadius}px`,
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
                  borderRadius: `${controlRadius}px`,
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

          <Stack spacing={1.5}>
            <Typography variant="overline" color="text.secondary">
              Details
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Team name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {teamName.trim()}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="overline" color="text.secondary">
              Identity
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Primary color
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {safePrimaryColor}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Logo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
                {logoUrl.trim() ? "Custom logo URL" : "Initials avatar"}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="overline" color="text.secondary">
              Rules
            </Typography>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Period structure
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {periodType === "HALVES" ? "Halves" : "Quarters"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Fouls to foul out
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {foulsToFoulOut}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Fouls to bonus
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {teamFoulsToBonus}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Fouls to double bonus
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {teamFoulsToDoubleBonus}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Timeouts
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>
                {timeoutsPerTeam} {timeoutScope === "HALF" ? "per half" : "per game"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>

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
