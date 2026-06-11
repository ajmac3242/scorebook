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
  gamesPlayed: number;
};

type UsePlayersDataProps = {
  searchTerm: string;
  activeTab: "active" | "archived";
  showSnackbar: (
    _message: string,
    _severity?: "success" | "error" | "info" | "warning",
  ) => void;
};

export const usePlayersData = ({
  searchTerm,
  activeTab,
  showSnackbar,
}: UsePlayersDataProps) => {
  const playersResult = useLiveQuery(() => {
    return db.players
      .toArray()
      .then((all) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return all.filter((player) => {
          if (player.deletedAt) return false;

          const matchesTab =
            activeTab === "active"
              ? !player.isArchived
              : Boolean(player.isArchived);

          if (!matchesTab) return false;

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
  }, [activeTab, searchTerm]);

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

    const mapped = players.map((player) => {
      const aggregate = aggregateMap.get(player.id!);
      return {
        ...player,
        ppg: aggregate?.points || 0,
        rpg: aggregate?.rebounds || 0,
        apg: aggregate?.assists || 0,
        gamesPlayed: aggregate?.gamesPlayed || 0,
      };
    });

    // Starred players sort first; within each group sort alphabetically by name
    mapped.sort((a, b) => {
      const aStar = Boolean(a.isStar);
      const bStar = Boolean(b.isStar);
      if (aStar && !bStar) return -1;
      if (!aStar && bStar) return 1;
      return a.name.localeCompare(b.name);
    });

    return mapped;
  }, [players, allStats]);

  const handleRestorePlayer = async (id: string) => {
    try {
      await db.players.update(id, { isArchived: 0, synced: 0 });
      await syncService.pushUpdates();
      showSnackbar("Player restored to active roster", "success");
    } catch (err) {
      logger.error("Failed to restore player", err, { id });
      showSnackbar("Failed to restore player", "error");
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
      showSnackbar("Failed to update star player", "error");
    }
  };

  return {
    playersWithStats,
    handleRestorePlayer,
    handleToggleStar,
  };
};
