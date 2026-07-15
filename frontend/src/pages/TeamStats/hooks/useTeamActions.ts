import { useState, useEffect } from "react";
import { db, type TeamPlayer, type Team, type Player } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";
import { useTokens } from "../../../theme/useTokens";

type UseTeamActionsProps = {
  teamId: string | undefined;
  team: Team | undefined;
  allPlayers: Player[];
  teamPlayers: TeamPlayer[];
  showSnackbar: (
    _message: string,
    _severity?: "success" | "error" | "info" | "warning",
  ) => void;
};

export const useTeamActions = ({
  teamId,
  team,
  allPlayers,
  teamPlayers,
  showSnackbar,
}: UseTeamActionsProps) => {
  const tokens = useTokens();
  const DEFAULT_TEAM_ACCENT = tokens.semantic.color.entity.defaultAccent;

  // Edit team settings state
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TEAM_ACCENT);
  const [editPeriodType, setEditPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [editPeriodLength, setEditPeriodLength] = useState<number>(10);
  const [editOvertimeLength, setEditOvertimeLength] = useState<number>(5);
  const [editTimeoutLimit, setEditTimeoutLimit] = useState<number>(3);
  const [editFoulLimit, setEditFoulLimit] = useState<number>(5);
  const [editMaxStintDuration, setEditMaxStintDuration] = useState<number>(8);
  const [editFoulWarningThresholds, setEditFoulWarningThresholds] = useState<
    Record<string, number>
  >({});
  const [editPlaybook, setEditPlaybook] = useState<string[]>([]);
  const [newPlayName, setNewPlayName] = useState("");

  useEffect(() => {
    if (team) {
      setEditName(team.name || "");
      setEditLogoUrl(team.logoUrl || "");
      setEditColor(team.primaryColor || DEFAULT_TEAM_ACCENT);
      setEditPeriodType(team.periodType || "QUARTERS");
      setEditPeriodLength(
        team.defaultPeriodLength || (team.periodType === "HALVES" ? 20 : 10),
      );
      setEditOvertimeLength(team.defaultOvertimeLength || 5);
      setEditTimeoutLimit(
        team.defaultTimeoutLimit || team.timeoutsPerTeam || 3,
      );
      setEditFoulLimit(team.defaultFoulLimit || 5);
      setEditMaxStintDuration(team.maxStintDuration || 8);
      setEditFoulWarningThresholds(team.foulWarningThresholds || {});
      setEditPlaybook(team.playbook || []);
    }
  }, [team, DEFAULT_TEAM_ACCENT]);

  const handleUpdateTeamSettings = async () => {
    if (!teamId) return;

    try {
      await db.teams.update(teamId, {
        name: editName,
        logoUrl: editLogoUrl,
        primaryColor: editColor,
        periodType: editPeriodType,
        defaultPeriodLength: editPeriodLength,
        defaultOvertimeLength: editOvertimeLength,
        defaultTimeoutLimit: editTimeoutLimit,
        defaultFoulLimit: editFoulLimit,
        maxStintDuration: editMaxStintDuration,
        foulWarningThresholds: editFoulWarningThresholds,
        playbook: editPlaybook,
        synced: 0,
      });

      await syncService.pushUpdates();
      setOpenSettingsDialog(false);
      showSnackbar("Team settings updated.", "success");
    } catch (error) {
      logger.error("Failed to update team settings:", error);
      showSnackbar("Unable to update team settings.", "error");
    }
  };

  // Delete team state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteTeam = async () => {
    if (!teamId || !team) return;
    try {
      const deletedAt = new Date().toISOString();
      await db.teams.update(team.id!, { deletedAt, synced: 0 });

      const teamGames = await db.games
        .where("teamId")
        .equals(team.id!)
        .toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt, synced: 0 });
      }

      await syncService.pushUpdates();
      setIsDeleteDialogOpen(false);
      showSnackbar("Team scheduled for deletion.", "success");
    } catch (err) {
      logger.error("Failed to delete team:", err);
      showSnackbar("Unable to delete team.", "error");
    }
  };

  const handleRestoreTeam = async () => {
    if (!teamId || !team) return;
    try {
      await db.teams.update(team.id!, { deletedAt: undefined, synced: 0 });

      const teamGames = await db.games
        .where("teamId")
        .equals(team.id!)
        .toArray();
      for (const g of teamGames) {
        await db.games.update(g.id!, { deletedAt: undefined, synced: 0 });
      }

      await syncService.pushUpdates();
      showSnackbar("Team restored.", "success");
    } catch (error) {
      logger.error("Failed to restore team:", error);
      showSnackbar("Unable to restore team.", "error");
    }
  };

  // Add game state
  const [openAddGame, setOpenAddGame] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [newOpponent, setNewOpponent] = useState("");
  const [newOpponentId, setNewOpponentId] = useState<string | undefined>(
    undefined,
  );
  const [newOpponentLogoUrl, setNewOpponentLogoUrl] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newPeriodType, setNewPeriodType] = useState<"QUARTERS" | "HALVES">(
    "QUARTERS",
  );
  const [newPeriodLength, setNewPeriodLength] = useState<number>(10);
  const [newTimeoutLimit, setNewTimeoutLimit] = useState<number>(3);
  const [newFoulLimit, setNewFoulLimit] = useState<number>(5);
  const [newTacticalKpis, setNewTacticalKpis] = useState<string[]>([
    "paint_touches",
    "efg",
    "stop_pct",
  ]);
  const [isSubmittingGame, setIsSubmittingGame] = useState(false);

  const resetGameForm = () => {
    setNewOpponent("");
    setNewOpponentId(undefined);
    setNewOpponentLogoUrl("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setActiveStep(0);

    if (team) {
      setNewPeriodType(team.periodType || "QUARTERS");
      setNewPeriodLength(
        team.defaultPeriodLength || (team.periodType === "HALVES" ? 20 : 10),
      );
      setNewTimeoutLimit(team.defaultTimeoutLimit || team.timeoutsPerTeam || 3);
      setNewFoulLimit(team.defaultFoulLimit || 5);
    }
  };

  const handleAddGame = async () => {
    if (!teamId || !newOpponent.trim()) return;
    setIsSubmittingGame(true);

    try {
      await db.open();

      let opponentId = newOpponentId;
      if (!opponentId) {
        const existing = await db.opponents
          .where("name")
          .equals(newOpponent)
          .first();
        if (existing) {
          opponentId = existing.id;
        } else {
          opponentId = crypto.randomUUID();
          await db.opponents.add({
            id: opponentId,
            name: newOpponent,
            logoUrl: newOpponentLogoUrl,
            roster: [],
            synced: 0,
          });
        }
      }

      await db.games.add({
        id: crypto.randomUUID(),
        teamId: teamId.toString(),
        opponent: newOpponent,
        opponentId,
        opponentLogoUrl: newOpponentLogoUrl,
        date: newDate,
        time: newTime,
        location: newLocation,
        periodLength: newPeriodLength,
        timeoutLimit: newTimeoutLimit,
        foulLimit: newFoulLimit,
        periodType: newPeriodType,
        tacticalKpis: newTacticalKpis,
        synced: 0,
      });

      await syncService.pushUpdates();
      setOpenAddGame(false);
      resetGameForm();
      showSnackbar("Game created.", "success");
    } catch (error) {
      logger.error("Failed to add game:", error);
      showSnackbar("Unable to create game.", "error");
    } finally {
      setIsSubmittingGame(false);
    }
  };

  // Roster management state
  const [openRosterDialog, setOpenRosterDialog] = useState(false);
  const [pendingRosterChanges, setPendingRosterChanges] = useState<
    Record<string, { action: "add" | "remove"; jersey?: string }>
  >({});
  const [localJerseyNumbers, setLocalJerseyNumbers] = useState<
    Record<string, string>
  >({});
  const [rosterSearchTerm, setRosterSearchTerm] = useState("");

  const stageRosterChange = (playerId: string, currentlyIn: boolean) => {
    const dbRecord = teamPlayers.find(
      (t: TeamPlayer) => t.playerId.toString() === playerId,
    );
    const isAlreadyInDb = !!dbRecord;

    setPendingRosterChanges((prev) => {
      const next = { ...prev };
      if (currentlyIn) {
        if (isAlreadyInDb) {
          next[playerId] = { action: "remove" };
        } else {
          delete next[playerId];
        }
      } else {
        if (isAlreadyInDb) {
          delete next[playerId];
        } else {
          next[playerId] = { action: "add" };
        }
      }
      return next;
    });
  };

  const stageJerseyUpdate = (playerId: string, jersey: string) => {
    setLocalJerseyNumbers((prev) => ({ ...prev, [playerId]: jersey }));
  };

  const handleSaveRoster = async () => {
    if (!teamId) return;

    try {
      for (const [pId, change] of Object.entries(pendingRosterChanges)) {
        if (change.action === "add") {
          const player = allPlayers.find((p) => p.id?.toString() === pId);
          await db.teamPlayers.add({
            id: crypto.randomUUID(),
            teamId: teamId.toString(),
            playerId: pId,
            name: player?.name,
            avatarColor: player?.avatarColor,
            jerseyNumber: localJerseyNumbers[pId] ?? "",
            synced: 0,
          });
        } else if (change.action === "remove") {
          await db.teamPlayers
            .where("[teamId+playerId]")
            .equals([teamId.toString(), pId])
            .delete();
        }
      }

      const existingPlayerIds = new Set(
        teamPlayers.map((tp) => tp.playerId.toString()),
      );

      for (const [pId, jersey] of Object.entries(localJerseyNumbers)) {
        if (
          existingPlayerIds.has(pId) &&
          pendingRosterChanges[pId]?.action !== "remove"
        ) {
          const record = await db.teamPlayers
            .where("[teamId+playerId]")
            .equals([teamId.toString(), pId])
            .first();

          if (record?.id) {
            await db.teamPlayers.update(record.id, {
              jerseyNumber: jersey,
              synced: 0,
            });
          }
        }
      }

      await syncService.pushUpdates();
      setOpenRosterDialog(false);
      setPendingRosterChanges({});
      setLocalJerseyNumbers({});
      setRosterSearchTerm("");
      showSnackbar("Roster updated.", "success");
    } catch (err) {
      logger.error("Failed to save roster changes:", err);
      showSnackbar("Unable to save roster changes.", "error");
    }
  };

  const handleCancelRoster = () => {
    setOpenRosterDialog(false);
    setPendingRosterChanges({});
    setLocalJerseyNumbers({});
    setRosterSearchTerm("");
  };

  return {
    // Settings
    openSettingsDialog,
    setOpenSettingsDialog,
    editName,
    setEditName,
    editLogoUrl,
    setEditLogoUrl,
    editColor,
    setEditColor,
    editPeriodType,
    setEditPeriodType,
    editPeriodLength,
    setEditPeriodLength,
    editOvertimeLength,
    setEditOvertimeLength,
    editTimeoutLimit,
    setEditTimeoutLimit,
    editFoulLimit,
    setEditFoulLimit,
    editMaxStintDuration,
    setEditMaxStintDuration,
    editFoulWarningThresholds,
    setEditFoulWarningThresholds,
    editPlaybook,
    setEditPlaybook,
    newPlayName,
    setNewPlayName,
    handleUpdateTeamSettings,
    // Delete
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleDeleteTeam,
    handleRestoreTeam,
    // Add Game
    openAddGame,
    setOpenAddGame,
    activeStep,
    setActiveStep,
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
    isSubmittingGame,
    handleAddGame,
    resetGameForm,
    // Roster
    openRosterDialog,
    setOpenRosterDialog,
    pendingRosterChanges,
    localJerseyNumbers,
    rosterSearchTerm,
    setRosterSearchTerm,
    stageRosterChange,
    stageJerseyUpdate,
    handleSaveRoster,
    handleCancelRoster,
  };
};
