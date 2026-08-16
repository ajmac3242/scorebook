import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  Groups as TeamsIcon,
  Search as SearchIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useLiveQuery } from "dexie-react-hooks";
import WorkflowDialogShell from "../workflow/WorkflowDialogShell";
import { db, type Player, type TeamPlayer } from "../../db";
import { syncService } from "../../utils/syncService";
import { logger } from "../../utils/logger";
import { AVATAR_COLORS } from "../../constants/colors";
import { useTokens } from "../../theme/useTokens";
import { getInitials } from "../../utils/stats";
import AvatarColorPicker from "../forms/AvatarColorPicker";
import PlayerIdentityPreview from "./PlayerIdentityPreview";

export type PlayerWorkflowDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  player?: Player;
  playerId?: string;
  onSuccess?: (_message: string) => void;
  onError?: (_message: string) => void;
};

type TeamAssignmentDraft = {
  selected: boolean;
  jerseyNumber: string;
  existingRecordId?: string;
};

const STEPS = ["Identity", "Appearance", "Teams", "Review"] as const;

const PlayerWorkflowDialog: React.FC<PlayerWorkflowDialogProps> = ({
  open,
  onClose,
  mode,
  player,
  playerId,
  onSuccess,
  onError,
}) => {
  const tokens = useTokens();

  const [activeStep, setActiveStep] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [isStar, setIsStar] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [teamAssignments, setTeamAssignments] = useState<
    Record<string, TeamAssignmentDraft>
  >({});

  const allTeams = useLiveQuery(async () => {
    const teams = await db.teams
      .filter((team) => !team.isArchived && !team.deletedAt)
      .toArray();
    return teams.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  const existingTeamPlayers = useLiveQuery(async () => {
    if (!open || mode !== "edit" || !playerId) return [];
    return db.teamPlayers.where("playerId").equals(playerId).toArray();
  }, [open, mode, playerId]);

  const activeTeams = useMemo(() => allTeams ?? [], [allTeams]);
  const currentTeamPlayers = useMemo(
    () => existingTeamPlayers ?? [],
    [existingTeamPlayers],
  );

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(false);
    setTeamSearchTerm("");

    if (mode === "edit" && player) {
      setPlayerName(player.name || "");
      setAvatarColor(player.avatarColor || AVATAR_COLORS[0]);
      setIsStar(Boolean(player.isStar));
    } else {
      setPlayerName("");
      setAvatarColor(AVATAR_COLORS[0]);
      setIsStar(false);
      setTeamAssignments({});
    }
  }, [open, mode, player]);

  useEffect(() => {
    if (!open || !allTeams) return;

    if (mode === "edit" && player) {
      const mapped = activeTeams.reduce<Record<string, TeamAssignmentDraft>>(
        (acc, team) => {
          const existing = currentTeamPlayers.find(
            (tp) => tp.teamId === team.id,
          );
          if (team.id) {
            acc[team.id] = {
              selected: Boolean(existing),
              jerseyNumber: existing?.jerseyNumber ?? "",
              existingRecordId: existing?.id,
            };
          }
          return acc;
        },
        {},
      );
      setTeamAssignments(mapped);
      return;
    }

    const mapped = activeTeams.reduce<Record<string, TeamAssignmentDraft>>(
      (acc, team) => {
        if (team.id) {
          acc[team.id] = { selected: false, jerseyNumber: "" };
        }
        return acc;
      },
      {},
    );
    setTeamAssignments(mapped);
  }, [open, mode, player, allTeams, activeTeams, currentTeamPlayers]);

  const title = mode === "create" ? "Create player" : "Edit player";
  const description =
    mode === "create"
      ? "Add a new player to your roster."
      : "Update player details, team assignments, and jersey numbers.";
  const submitLabel = mode === "create" ? "Create player" : "Save changes";

  const resetState = () => {
    setActiveStep(0);
    setPlayerName("");
    setAvatarColor(AVATAR_COLORS[0]);
    setIsStar(false);
    setShowValidation(false);
    setSubmitError("");
    setIsSubmitting(false);
    setTeamSearchTerm("");
    setTeamAssignments({});
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const identityValid = playerName.trim().length > 0;
  const validateStep = (step: number) => (step === 0 ? identityValid : true);

  const handleNext = () => {
    setShowValidation(true);
    setSubmitError("");
    if (!validateStep(activeStep)) return;
    setShowValidation(false);
    setActiveStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setSubmitError("");
    setActiveStep((current) => Math.max(current - 1, 0));
  };

  const updateTeamAssignment = (
    teamId: string,
    updater: (_draft: TeamAssignmentDraft) => TeamAssignmentDraft,
  ) => {
    setTeamAssignments((prev) => {
      const existing = prev[teamId] ?? { selected: false, jerseyNumber: "" };
      return { ...prev, [teamId]: updater(existing) };
    });
  };

  const toggleTeam = (teamId: string) => {
    updateTeamAssignment(teamId, (current) => ({
      ...current,
      selected: !current.selected,
    }));
  };

  const updateJersey = (teamId: string, value: string) => {
    if (value !== "" && !/^\d{1,2}$/.test(value)) return;
    updateTeamAssignment(teamId, (current) => ({
      ...current,
      jerseyNumber: value,
      selected: true,
    }));
  };

  const selectedTeams = useMemo(
    () =>
      activeTeams.filter(
        (team) => team.id && teamAssignments[team.id]?.selected,
      ),
    [activeTeams, teamAssignments],
  );

  const filteredTeams = useMemo(() => {
    const search = teamSearchTerm.trim().toLowerCase();
    if (!search) return activeTeams;
    return activeTeams.filter((team) =>
      `${team.name} ${team.description ?? ""}`.toLowerCase().includes(search),
    );
  }, [activeTeams, teamSearchTerm]);

  const persistTeamAssignments = async (
    savedPlayerId: string,
    savedName: string,
    savedAvatarColor: string,
  ) => {
    const currentByTeamId = new Map(
      currentTeamPlayers.map((tp) => [tp.teamId, tp] as const),
    );
    const toAdd: TeamPlayer[] = [];
    const toUpdate: Array<{ id: string; changes: Partial<TeamPlayer> }> = [];
    const toDelete: string[] = [];

    for (const team of activeTeams) {
      if (!team.id) continue;
      const draft = teamAssignments[team.id] ?? {
        selected: false,
        jerseyNumber: "",
      };
      const existing = currentByTeamId.get(team.id);
      const normalizedJersey = draft.jerseyNumber.trim();

      if (draft.selected && !existing) {
        toAdd.push({
          id: crypto.randomUUID(),
          teamId: team.id,
          playerId: savedPlayerId,
          name: savedName,
          avatarColor: savedAvatarColor,
          jerseyNumber: normalizedJersey || undefined,
          synced: 0,
        });
      } else if (draft.selected && existing?.id) {
        toUpdate.push({
          id: existing.id,
          changes: {
            name: savedName,
            avatarColor: savedAvatarColor,
            jerseyNumber: normalizedJersey || undefined,
            synced: 0,
          },
        });
      } else if (!draft.selected && existing?.id) {
        toDelete.push(existing.id);
      }
    }

    if (toAdd.length > 0) await db.teamPlayers.bulkPut(toAdd);
    if (toUpdate.length > 0)
      await Promise.all(
        toUpdate.map((item) => db.teamPlayers.update(item.id, item.changes)),
      );
    if (toDelete.length > 0) await db.teamPlayers.bulkDelete(toDelete);
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    setSubmitError("");
    if (!identityValid) return;
    setIsSubmitting(true);

    try {
      const trimmedName = playerName.trim();
      const nextIsStar = isStar ? 1 : 0;
      const resolvedPlayerId = mode === "edit" ? playerId : crypto.randomUUID();

      if (!resolvedPlayerId) throw new Error("Missing player id");

      if (mode === "create") {
        await db.players.add({
          id: resolvedPlayerId,
          name: trimmedName,
          avatarColor,
          isStar: nextIsStar,
          isArchived: 0,
          synced: 0,
        });
      } else {
        await db.players.update(resolvedPlayerId, {
          name: trimmedName,
          avatarColor,
          isStar: nextIsStar,
          synced: 0,
        });
      }

      await persistTeamAssignments(resolvedPlayerId, trimmedName, avatarColor);
      await syncService.pushUpdates();

      onSuccess?.(
        mode === "create"
          ? "Player added successfully!"
          : "Player updated successfully!",
      );
      resetState();
      onClose();
    } catch (err) {
      logger.error(`Failed to ${mode} player`, err, { playerId, playerName });
      const message =
        mode === "create" ? "Failed to add player" : "Failed to update player";
      setSubmitError(message);
      onError?.(message);
      setIsSubmitting(false);
    }
  };

  const preview = (
    <Box role="status" aria-live="polite">
      <PlayerIdentityPreview
        playerName={playerName}
        avatarColor={avatarColor}
        isStar={isStar}
      />
    </Box>
  );

  // ─── Step 1: Identity ──────────────────────────────────────────────────────

  const renderIdentityStep = () => (
    <Stack spacing={3}>
      <TextField
        autoFocus
        size="small"
        label="Player name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        error={showValidation && !playerName.trim()}
        helperText={
          showValidation && !playerName.trim()
            ? "Player name is required"
            : "Full name shown on rosters, stats, and game summaries."
        }
        fullWidth
        slotProps={{ formHelperText: { sx: { color: "text.secondary" } } }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleNext();
          }
        }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={isStar}
            onChange={(e) => setIsStar(e.target.checked)}
            color="warning"
          />
        }
        label={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <StarIcon
              sx={{
                fontSize: tokens.semantic.component.iconSize.sm,
                color: isStar ? "warning.main" : "text.disabled",
                transition: `color ${tokens.motion.duration.normal}`,
              }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Star player
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sorts first on the roster and is highlighted in game summaries.
              </Typography>
            </Box>
          </Stack>
        }
        sx={{ alignItems: "flex-start", mx: 0 }}
      />

      {preview}
    </Stack>
  );

  // ─── Step 2: Appearance ────────────────────────────────────────────────────

  const renderAppearanceStep = () => (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: tokens.semantic.typography.button.fontWeight,
            color: "text.primary",
            mb: `${tokens.semantic.spacing.sm}px`,
          }}
        >
          Avatar color
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: `${tokens.semantic.spacing.md}px` }}
        >
          Used on the player card, roster, and in-game stat views.
        </Typography>
        <AvatarColorPicker
          colors={AVATAR_COLORS}
          selectedColor={avatarColor}
          onChange={setAvatarColor}
        />
      </Box>
      {preview}
    </Stack>
  );

  // ─── Step 3: Teams ─────────────────────────────────────────────────────────

  const renderTeamsStep = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Assign this player to one or more teams and optionally set a jersey
        number for each roster.
      </Typography>

      <TextField
        size="small"
        placeholder="Search teams"
        value={teamSearchTerm}
        onChange={(e) => setTeamSearchTerm(e.target.value)}
        fullWidth
        slotProps={{
          htmlInput: {
            "aria-label": "Search teams for player assignment",
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {activeTeams.length === 0 ? (
        <Stack
          spacing={1.5}
          sx={{
            alignItems: "center",
            py: `${tokens.semantic.spacing.xl}px`,
          }}
        >
          <TeamsIcon
            sx={{
              fontSize: tokens.semantic.component.iconSize.xl,
              color: "text.disabled",
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center" }}
          >
            No active teams yet. Create a team first, then assign players to it.
          </Typography>
        </Stack>
      ) : filteredTeams.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No teams match &ldquo;{teamSearchTerm}&rdquo;.
        </Typography>
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            maxHeight: 360,
            overflowY: "auto",
            bgcolor: "background.paper",
          }}
        >
          {filteredTeams.map((team, idx) => {
            if (!team.id) return null;
            const accentColor =
              team.primaryColor ?? tokens.semantic.color.brand.primary.main;
            const assignment = teamAssignments[team.id] ?? {
              selected: false,
              jerseyNumber: "",
            };
            const isSelected = assignment.selected;
            const soft = `${accentColor}14`;

            return (
              <Box
                key={team.id}
                onClick={() => toggleTeam(team.id!)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "auto minmax(0,1fr)",
                    sm: "auto minmax(0,1fr) auto",
                  },
                  alignItems: "center",
                  gap: `${tokens.semantic.spacing.sm}px`,
                  px: `${tokens.semantic.spacing.md}px`,
                  py: `${tokens.semantic.spacing.sm}px`,
                  borderBottom:
                    idx < filteredTeams.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  cursor: "pointer",
                  bgcolor: isSelected ? soft : "background.paper",
                  transition: `background-color ${tokens.motion.duration.fast}`,
                  "&:hover": {
                    bgcolor: isSelected
                      ? soft
                      : "var(--cs-semantic-color-action-hover)",
                  },
                }}
              >
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: `${tokens.semantic.component.radius.button}px`,
                    bgcolor: `${accentColor}1F`,
                    color: accentColor,
                    border: `1px solid ${accentColor}3D`,
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                    fontSize: tokens.semantic.typography.caption.fontSize,
                  }}
                >
                  {getInitials(team.name)}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ alignItems: "center", flexWrap: "wrap" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight:
                          tokens.semantic.typography.button.fontWeight,
                        color: isSelected ? accentColor : "text.primary",
                        transition: `color ${tokens.motion.duration.fast}`,
                      }}
                      noWrap
                    >
                      {team.name}
                    </Typography>
                    {team.isFavorite ? (
                      <Chip
                        label="Default"
                        size="small"
                        sx={{
                          height: tokens.semantic.component.iconSize.sm,
                          borderRadius: `${tokens.semantic.component.radius.chip}px`,
                          fontSize: tokens.semantic.typography.caption.fontSize,
                          fontWeight:
                            tokens.semantic.typography.button.fontWeight,
                        }}
                      />
                    ) : null}
                  </Stack>
                  {team.description ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {team.description}
                    </Typography>
                  ) : null}
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    gridColumn: { xs: "2 / -1", sm: "auto" },
                    justifySelf: { xs: "start", sm: "end" },
                    mt: { xs: 0.5, sm: 0 },
                    ml: {
                      xs: `calc(36px + ${tokens.semantic.spacing.sm}px)`,
                      sm: 0,
                    },
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TextField
                    size="small"
                    label="#"
                    value={assignment.jerseyNumber}
                    disabled={!isSelected}
                    onChange={(e) => updateJersey(team.id!, e.target.value)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 2,
                        inputMode: "numeric",
                        "aria-label": `Jersey number for ${team.name}`,
                      },
                    }}
                    sx={{ width: 72 }}
                  />
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleTeam(team.id!)}
                    size="small"
                    slotProps={{
                      input: {
                        "aria-label": `Assign ${playerName || "player"} to ${team.name}`,
                      },
                    }}
                  />
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      <Typography variant="caption" color="text.secondary">
        Assigned to {selectedTeams.length}{" "}
        {selectedTeams.length === 1 ? "team" : "teams"}. Jersey number is
        optional and can differ by team.
      </Typography>
    </Stack>
  );

  // ─── Step 4: Review ────────────────────────────────────────────────────────

  const renderReviewStep = () => (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        Review the player details before{" "}
        {mode === "create" ? "creating" : "saving"}. You can edit everything
        later.
      </Typography>

      {preview}

      <Stack
        spacing={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {(
          [
            { label: "Name", value: playerName.trim() },
            {
              label: "Status",
              value: (
                <Chip
                  size="small"
                  icon={
                    <StarIcon
                      sx={{
                        fontSize: `${tokens.semantic.component.iconSize.xs}px !important`,
                      }}
                    />
                  }
                  label={isStar ? "Star player" : "Standard"}
                  color={isStar ? "warning" : "default"}
                  sx={{
                    borderRadius: `${tokens.semantic.component.radius.chip}px`,
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                    fontSize: tokens.semantic.typography.caption.fontSize,
                  }}
                />
              ),
            },
            {
              label: "Avatar color",
              value: (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bgcolor: avatarColor,
                      border: "1px solid",
                      borderColor: "divider",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">{avatarColor}</Typography>
                </Stack>
              ),
            },
            {
              label: "Teams",
              value:
                selectedTeams.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    None selected
                  </Typography>
                ) : (
                  <Stack spacing={0.75} sx={{ alignItems: "flex-end" }}>
                    {selectedTeams.map((team) => {
                      const accentColor =
                        team.primaryColor ??
                        tokens.semantic.color.brand.primary.main;
                      const jersey = team.id
                        ? teamAssignments[team.id]?.jerseyNumber
                        : "";
                      return (
                        <Stack
                          key={team.id}
                          direction="row"
                          spacing={0.75}
                          sx={{
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Chip
                            label={team.name}
                            size="small"
                            sx={{
                              borderRadius: `${tokens.semantic.component.radius.chip}px`,
                              fontSize:
                                tokens.semantic.typography.caption.fontSize,
                              bgcolor: `${accentColor}1F`,
                              color: accentColor,
                              border: "1px solid",
                              borderColor: `${accentColor}3D`,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {jersey ? `#${jersey}` : "No jersey"}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                ),
            },
          ] as Array<{ label: string; value: React.ReactNode }>
        ).map(({ label, value }, idx, arr) => (
          <Stack
            key={label}
            direction="row"
            sx={{
              px: `${tokens.semantic.spacing.md}px`,
              py: `${tokens.semantic.spacing.sm}px`,
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: idx < arr.length - 1 ? "1px solid" : "none",
              borderColor: "divider",
              bgcolor:
                idx % 2 === 0
                  ? "background.paper"
                  : "var(--cs-semantic-color-surface-subtle)",
              gap: `${tokens.semantic.spacing.md}px`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: tokens.semantic.typography.button.fontWeight,
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              {label}
            </Typography>
            {typeof value === "string" ? (
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                {value}
              </Typography>
            ) : (
              value
            )}
          </Stack>
        ))}
      </Stack>

      {submitError ? (
        <Typography variant="body2" color="error.main" role="alert" aria-live="assertive">
          {submitError}
        </Typography>
      ) : null}
    </Stack>
  );

  const stepContent = [
    renderIdentityStep,
    renderAppearanceStep,
    renderTeamsStep,
    renderReviewStep,
  ];

  return (
    <WorkflowDialogShell
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      steps={STEPS}
      activeStep={activeStep}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      maxWidth="md"
    >
      {stepContent[activeStep]()}
    </WorkflowDialogShell>
  );
};

export default PlayerWorkflowDialog;
