import React from "react";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { type StatEvent, type Game } from "../../../db";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import StatTable, {
  type StatTableColumn,
} from "../../../components/data-display/StatTable";
import { calculatePlayerAggregates } from "../../../utils/stats";

type GameRow = {
  date: string;
  opponent: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg: string;
  plusMinus: number;
};

const COLUMNS: StatTableColumn<GameRow>[] = [
  { key: "date", label: "Date", align: "left" },
  { key: "opponent", label: "Opponent", align: "left" },
  { key: "pts", label: "PTS", align: "right" },
  { key: "reb", label: "REB", align: "right" },
  { key: "ast", label: "AST", align: "right" },
  { key: "stl", label: "STL", align: "right" },
  { key: "blk", label: "BLK", align: "right" },
  { key: "fg", label: "FG", align: "right" },
  {
    key: "plusMinus",
    label: "+/-",
    align: "right",
    color: (v) => {
      const n = Number(v);
      if (n > 0) return "success.main";
      if (n < 0) return "error.main";
      return undefined;
    },
    format: (v) => {
      const n = Number(v);
      return n > 0 ? `+${n}` : String(n);
    },
  },
];

type PlayerGameLogCardProps = {
  games: Game[];
  allStats: StatEvent[];
  playerId: string | undefined;
};

export const PlayerGameLogCard: React.FC<PlayerGameLogCardProps> = ({
  games,
  allStats,
  playerId,
}) => {
  const rows: GameRow[] = React.useMemo(() => {
    if (!playerId) return [];

    return [...games]
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
      .map((game) => {
        const gameStats = allStats.filter(
          (s) => s.gameId === game.id && s.playerId === playerId,
        );

        const agg = calculatePlayerAggregates(
          [],
          gameStats,
          [],
          "total",
          {},
        )[0] ?? {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          makes: 0,
          attempts: 0,
          plusMinus: 0,
        };

        return {
          date: game.date ? dayjs(game.date).format("MMM D") : "—",
          opponent: game.opponent || "Opponent",
          pts: agg.points,
          reb: agg.rebounds,
          ast: agg.assists,
          stl: agg.steals,
          blk: agg.blocks,
          fg: `${agg.makes}/${agg.attempts}`,
          plusMinus: agg.plusMinus,
        };
      });
  }, [games, allStats, playerId]);

  return (
    <PageSectionCard sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2.25,
          py: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6">Game Log</Typography>
        <Typography variant="body2" color="text.secondary">
          Per-game stats for the selected season and filters.
        </Typography>
      </Box>

      <StatTable
        rows={rows}
        columns={COLUMNS}
        emptyMessage="No games recorded yet."
        size="small"
      />
    </PageSectionCard>
  );
};

export default PlayerGameLogCard;
