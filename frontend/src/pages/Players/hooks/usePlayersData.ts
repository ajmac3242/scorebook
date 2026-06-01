import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { syncService } from "../../../utils/syncService";
import { calculatePlayerAggregates } from "../../../utils/stats";
import { logger } from "../../../utils/logger";

export type PlayerWithStats = {
  id?: string;
  name: string;
  avatarColor?: string;
  isArchived?: number;
  isStar?: number;
  ppg: number;
  rpg: number;
  apg: number;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

type UsePlayersDataProps = {
  searchTerm: string;
  showArchived: boolean;
  setSnackbar: (_s: SnackbarState) => void;
};

export const usePlayersData = ({
  searchTerm,
  showArchived,
  setSnackbar,
}: UsePlayersDataProps) => {
  const playersResult = useLiveQuery(() => {
    return db.players
      .toArray()
      .then((all) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return all.filter((player) => {
          if (player.deletedAt) return false;
          if (!showArchived && player.isArchived) return false;
          if (
            normalizedSearch &&
            !player.name.toLowerCase().includes(normalizedSearch)
          ) {
            return false;
          }
          return true;
        });
      })
      .catch((err) => {
        logger.error("Failed to fetch players:", err);
        return [];
      });
  }, [showArchived, searchTerm]);

  const players = useMemo(() => playersResult || [], [playersResult]);

  const allStatsResult = useLiveQuery(() => db.stats.toArray());
  const allStats = useMemo(() => allStatsResult || [], [allStatsResult]);

  const playersWithStats = useMemo<PlayerWithStats[]>(() => {
    const aggregates = calculatePlayerAggregates(
      players,
      allStats,
      [],
      "average",
    );

    const aggregateMap = new Map();
    for (let i = 0; i < aggregates.length; i++) {
      const aggregate = aggregates[i];
      aggregateMap.set(aggregate.id, aggregate);
    }

    return players.map((player) => {
      const aggregate = aggregateMap.get(player.id!);
      return {
        ...player,
        ppg: aggregate?.points || 0,
        rpg: aggregate?.rebounds || 0,
        apg: aggregate?.assists || 0,
      };
    });
  }, [players, allStats]);

  const starCount = useMemo(
    () => playersWithStats.filter((player) => player.isStar).length,
    [playersWithStats],
  );

  const archivedCount = useMemo(
    () => playersWithStats.filter((player) => player.isArchived).length,
    [playersWithStats],
  );

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      await syncService.pushUpdates();

      setSnackbar({
        open: true,
        message: "Player restored",
        severity: "success",
      });
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
      setSnackbar({
        open: true,
        message: "Failed to restore player",
        severity: "error",
      });
    }
  };

  const handleToggleStar = async (
    e: React.MouseEvent,
    id: string,
    currentIsStar: number | undefined,
  ) => {
    e.stopPropagation();

    try {
      await db.players.update(id, {
        isStar: currentIsStar ? 0 : 1,
        synced: 0,
      });
      await syncService.pushUpdates();
    } catch (err) {
      logger.error("Failed to toggle star player status", err, { id });
      setSnackbar({
        open: true,
        message: "Failed to update star player",
        severity: "error",
      });
    }
  };

  return {
    playersWithStats,
    starCount,
    archivedCount,
    handleRestorePlayer,
    handleToggleStar,
  };
};
