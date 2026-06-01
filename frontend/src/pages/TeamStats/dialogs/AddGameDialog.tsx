import React from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import dayjs from "dayjs";
import { type Opponent } from "../../db";
import { useTokens } from "../../theme/useTokens";

type AddGameDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  activeStep: number;
  setActiveStep: (_step: number | ((_prev: number) => number)) => void;
  isSubmitting: boolean;
  allOpponents: Opponent[];
  allRecentLocations: string[];
  newOpponent: string;
  setNewOpponent: (_v: string) => void;
  newOpponentId: string | undefined;
  setNewOpponentId: (_v: string | undefined) => void;
  newOpponentLogoUrl: string;
  setNewOpponentLogoUrl: (_v: string) => void;
  newDate: string;
  setNewDate: (_v: string) => void;
  newTime: string;
  setNewTime: (_v: string) => void;
  newLocation: string;
  setNewLocation: (_v: string) => void;
  newPeriodType: "QUARTERS" | "HALVES";
  setNewPeriodType: (_v: "QUARTERS" | "HALVES") => void;
  newPeriodLength: number;
  setNewPeriodLength: (_v: number) => void;
  newTimeoutLimit: number;
  setNewTimeoutLimit: (_v: number) => void;
  newFoulLimit: number;
  setNewFoulLimit: (_v: number) => void;
  newTacticalKpis: string[];
  setNewTacticalKpis: (_v: string[]) => void;
  tokens: ReturnType<typeof useTokens>;
};

const AddGameDialog: React.FC<AddGameDialogProps> = ({
  open,
  onClose,
  onSubmit,
  activeStep,
  setActiveStep,
  isSubmitting,
  allOpponents,
  allRecentLocations,
  newOpponent,
  setNewOpponent,
  newOpponentId,
  setNewOpponentId,
  newOpponentLogoUrl,
  setNewOpponentLogoUrl,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  newLocation,
  setNewLocation,
  newPeriodType,
  setNewPeriodType,
  newPeriodLength,
  setNewPeriodLength,
  newTimeoutLimit,
  setNewTimeoutLimit,
  newFoulLimit,
  setNewFoulLimit,
  newTacticalKpis,
  setNewTacticalKpis,
  tokens,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Schedule new game</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ py: 3 }}>
          <Step>
            <StepLabel>Opponent</StepLabel>
          </Step>
          <Step>
            <StepLabel>Logistics</StepLabel>
          </Step>
          <Step>
            <StepLabel>Settings</StepLabel>
          </Step>
          <Step>
            <StepLabel>Identity</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review</StepLabel>
          </Step>
        </Stepper>

        <Box sx={{ mt: 1, minHeight: 280 }}>
          {activeStep === 0 && (
            <Stack spacing={2.5}>
              <Autocomplete
                freeSolo
                options={allOpponents}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.name
                }
                value={
                  newOpponentId
                    ? allOpponents.find((o) => o.id === newOpponentId)
                    : newOpponent
                }
                onChange={(_, newValue) => {
                  if (typeof newValue === "string") {
                    setNewOpponent(newValue);
                    setNewOpponentId(undefined);
                  } else if (newValue && newValue.name) {
                    setNewOpponent(newValue.name);
                    setNewOpponentId(newValue.id);
                    if (newValue.logoUrl)
                      setNewOpponentLogoUrl(newValue.logoUrl);
                  } else {
                    setNewOpponent("");
                    setNewOpponentId(undefined);
                  }
                }}
                onInputChange={(_, newInputValue) =>
                  setNewOpponent(newInputValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    label="Opponent name"
                    fullWidth
                    placeholder="e.g. Springfield Atoms"
                    required
                  />
                )}
              />

              <TextField
                label="Opponent logo URL"
                fullWidth
                value={newOpponentLogoUrl}
                onChange={(e) => setNewOpponentLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={2.5}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />

              <TextField
                label="Time"
                type="time"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />

              <Autocomplete
                freeSolo
                options={allRecentLocations}
                value={newLocation}
                onInputChange={(_, newValue) => setNewLocation(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Location" fullWidth />
                )}
              />
            </Stack>
          )}

          {activeStep === 2 && (
            <Stack spacing={2.5}>
              <FormControl fullWidth>
                <InputLabel>Period type</InputLabel>
                <Select
                  value={newPeriodType}
                  label="Period type"
                  onChange={(e) =>
                    setNewPeriodType(e.target.value as "QUARTERS" | "HALVES")
                  }
                >
                  <MenuItem value="QUARTERS">Quarters</MenuItem>
                  <MenuItem value="HALVES">Halves</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Period length (minutes)"
                type="number"
                value={newPeriodLength}
                onChange={(e) =>
                  setNewPeriodLength(parseInt(e.target.value, 10) || 0)
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  fullWidth
                  label="Timeouts"
                  type="number"
                  value={newTimeoutLimit}
                  onChange={(e) =>
                    setNewTimeoutLimit(parseInt(e.target.value, 10) || 0)
                  }
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <TextField
                  fullWidth
                  label="Foul limit"
                  type="number"
                  value={newFoulLimit}
                  onChange={(e) =>
                    setNewFoulLimit(parseInt(e.target.value, 10) || 0)
                  }
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Stack>
            </Stack>
          )}

          {activeStep === 3 && (
            <Stack spacing={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                SELECT TACTICAL IDENTITY KPIS
              </Typography>

              {[
                { id: "paint_touches", label: "Paint Touches (Rim Pressure)" },
                { id: "efg", label: "eFG% (Shooting Efficiency)" },
                { id: "stop_pct", label: "Stop % (Defensive Consistency)" },
                { id: "to_rate", label: "Turnover Rate (Ball Security)" },
                { id: "oreb_pct", label: "Offensive Rebound %" },
              ].map((kpi) => (
                <FormControlLabel
                  key={kpi.id}
                  control={
                    <Checkbox
                      checked={newTacticalKpis.includes(kpi.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTacticalKpis([...newTacticalKpis, kpi.id]);
                        } else {
                          setNewTacticalKpis(
                            newTacticalKpis.filter((id) => id !== kpi.id),
                          );
                        }
                      }}
                    />
                  }
                  label={kpi.label}
                />
              ))}
            </Stack>
          )}

          {activeStep === 4 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Review game details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    OPPONENT
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {newOpponent}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    LOGISTICS
                  </Typography>
                  <Typography variant="body1">
                    {newDate ? dayjs(newDate).format("MMM D, YYYY") : "—"}{" "}
                    {newTime}
                  </Typography>
                  <Typography variant="caption">{newLocation}</Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    FORMAT
                  </Typography>
                  <Typography variant="body2">
                    {newPeriodType} ({newPeriodLength}m)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    LIMITS
                  </Typography>
                  <Typography variant="body2">
                    Fouls: {newFoulLimit} | Timeouts: {newTimeoutLimit}
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                Everything looks good. Click “Create game” to add it to the
                schedule.
              </Alert>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button
          disabled={activeStep === 0 || isSubmitting}
          onClick={() => setActiveStep((prev) => prev - 1)}
          startIcon={<NavigateBefore />}
        >
          Back
        </Button>

        {activeStep < 4 ? (
          <Button
            variant="contained"
            disabled={
              (activeStep === 0 && !newOpponent.trim()) ||
              (activeStep === 1 && !newDate) ||
              isSubmitting
            }
            onClick={() => setActiveStep((prev) => prev + 1)}
            endIcon={<NavigateNext />}
            sx={{
              borderRadius: `${tokens.semantic.component.radius.button}px`,
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={isSubmitting}
            sx={{
              bgcolor: "success.main",
              "&:hover": { bgcolor: "success.dark" },
              borderRadius: `${tokens.semantic.component.radius.button}px`,
            }}
          >
            {isSubmitting ? "Creating..." : "Create game"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddGameDialog;
