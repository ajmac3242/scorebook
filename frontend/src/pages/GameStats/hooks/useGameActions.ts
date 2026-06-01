import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { db, type Game } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { logger } from "../../../utils/logger";

interface UseGameActionsProps {
  game: Game | undefined;
  gameId: string | undefined;
  teamName: string | undefined;
}

export function useGameActions({ game, gameId, teamName }: UseGameActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  const [isPracticePlannerOpen, setIsPracticePlannerOpen] = useState(false);
  const [isDefensiveIntegrityOpen, setIsDefensiveIntegrityOpen] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editOpponent, setEditOpponent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");

  useEffect(() => {
    if (game) {
      setEditOpponent(game.opponent || "");
      setEditDate(game.date || "");
      setEditTime(game.time || "");
      setEditLocation(game.location || "");
      setEditOpponentLogoUrl(game.opponentLogoUrl || "");
    }
  }, [game]);

  useEffect(() => {
    if (game?.deletedAt) {
      const timer = setInterval(() => {
        const deleteTime = dayjs(game.deletedAt).add(24, "hour");
        const diff = deleteTime.diff(dayjs());
        if (diff <= 0) {
          setTimeLeft("Deleting now...");
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}h ${mins}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game?.deletedAt]);

  const handleDeleteGame = useCallback(async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, {
        deletedAt: new Date().toISOString(),
        synced: 0,
      });
      await syncService.pushUpdates();
      setIsDeleteDialogOpen(false);
    } catch (err) {
      logger.error("Failed to delete game:", err);
    }
  }, [gameId, game]);

  const handleRestoreGame = useCallback(async () => {
    if (!gameId || !game) return;
    try {
      await db.games.update(game.id!, { deletedAt: undefined, synced: 0 });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to restore game:", err);
    }
  }, [gameId, game]);

  const handleUpdateGame = useCallback(async () => {
    if (!gameId) return;
    try {
      await db.games.update(gameId, {
        opponent: editOpponent,
        date: editDate,
        time: editTime,
        location: editLocation,
        opponentLogoUrl: editOpponentLogoUrl,
        synced: 0,
      });
      await syncService.pushUpdates();
      setOpenEditDialog(false);
    } catch (err) {
      logger.error("Failed to update game:", err);
    }
  }, [
    gameId,
    editOpponent,
    editDate,
    editTime,
    editLocation,
    editOpponentLogoUrl,
  ]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    const element = document.getElementById("game-stats-container");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BoxScore_${teamName}_vs_${game?.opponent}_${game?.date}.pdf`);
    } catch (err) {
      logger.error("Failed to export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  }, [teamName, game?.opponent, game?.date]);

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    timeLeft,
    openEditDialog,
    setOpenEditDialog,
    isAuditDialogOpen,
    setIsAuditDialogOpen,
    isPracticePlannerOpen,
    setIsPracticePlannerOpen,
    isDefensiveIntegrityOpen,
    setIsDefensiveIntegrityOpen,
    isExporting,
    editOpponent,
    setEditOpponent,
    editDate,
    setEditDate,
    editTime,
    setEditTime,
    editLocation,
    setEditLocation,
    editOpponentLogoUrl,
    setEditOpponentLogoUrl,
    handleDeleteGame,
    handleRestoreGame,
    handleUpdateGame,
    handleExportPDF,
  };
}

export type GameActions = ReturnType<typeof useGameActions>;
