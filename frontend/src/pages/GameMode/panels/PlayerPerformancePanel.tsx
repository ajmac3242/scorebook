import React from "react";
import {
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  TableSortLabel,
  TableBody,
} from "@mui/material";
import { MoleskineCard } from "../../../components/SharedUI";
import { SparkPlugTable } from "../SparkPlugTable";
import { PlayerStatRow } from "../../../components/PlayerStatRow";
import PlaybookEfficiencyWidget from "../../../components/PlaybookEfficiencyWidget";
import { ChainActionBanner } from "../../../components/ChainActionBanner";
import type { PlayerAggregates } from "../../../utils/stats";
import type { Team } from "../../../db";
import type {
  PlaybookEfficiency,
  ChainPrompt,
  SparkPlugIndex,
} from "../../../hooks/useGameMode";

type SortConfig = {
  key: keyof PlayerAggregates;
  direction: "asc" | "desc";
};

type PlayerPerformancePanelProps = {
  sortedStatsGridData: PlayerAggregates[];
  sortConfig: SortConfig;
  onSortChange: (key: keyof PlayerAggregates) => void;
  jerseyMap: Map<string, string>;
  draftOnCourtIds: Set<string>;
  chainPrompt: ChainPrompt | null;
  onChainPromptDismiss: () => void;
  onChainAction: (type: string) => void;
  playbookEfficiency: PlaybookEfficiency | null;
  team: Team | undefined;
  gameId: string;
  period: number;
  clockSeconds: number;
  isReadOnly: boolean;
  sparkPlugIndex: SparkPlugIndex[];
  playerNamesMap: Map<string, string>;
  teamPpp: string;
  sortedGameStats: PlayerAggregates[];
  trackingMode: "TEAM" | "OPPONENT";
};

export const PlayerPerformancePanel: React.FC<PlayerPerformancePanelProps> = ({
  sortedStatsGridData,
  sortConfig,
  onSortChange,
  jerseyMap,
  draftOnCourtIds,
  chainPrompt,
  onChainPromptDismiss,
  onChainAction,
  playbookEfficiency,
  team,
  sparkPlugIndex,
  playerNamesMap,
  teamPpp,
  sortedGameStats,
  trackingMode,
}) => {
  return (
    <>
      {trackingMode === "TEAM" && (
        <>
          {chainPrompt && (
            <ChainActionBanner
              prompt={chainPrompt}
              onAction={onChainAction}
              onDismiss={onChainPromptDismiss}
            />
          )}
          <PlaybookEfficiencyWidget
            plays={playbookEfficiency}
            teamPpp={parseFloat(teamPpp)}
            gameStats={sortedGameStats}
          />
        </>
      )}

      <MoleskineCard>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Player Performance
        </Typography>
        <SparkPlugTable
          sparkPlugIndex={sparkPlugIndex}
          jerseyMap={jerseyMap}
          playerNamesMap={playerNamesMap}
        />
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small" aria-label="Player stats">
            <TableHead>
              <TableRow>
                {[
                  {
                    label: "#",
                    key: "jerseyNumber",
                    desc: "Jersey Number",
                  },
                  { label: "NAME", key: "name", desc: "Player Name" },
                  {
                    label: "MIN",
                    key: "min",
                    desc: "Minutes Played",
                  },
                  {
                    label: "PTS",
                    key: "points",
                    desc: "Points Scored",
                  },
                  {
                    label: "REB",
                    key: "rebounds",
                    desc: "Total Rebounds",
                  },
                  { label: "AST", key: "assists", desc: "Assists" },
                  {
                    label: "PF",
                    key: "fouls",
                    desc: "Personal Fouls",
                  },
                  {
                    label: "+/-",
                    key: "plusMinus",
                    desc: "Plus/Minus Rating",
                  },
                ].map((head) => (
                  <TableCell
                    key={head.key}
                    sx={{
                      fontSize: "var(--cs-typography-fontSize-xs)",
                      fontWeight: 800,
                      borderBottom:
                        "1px solid var(--cs-semantic-color-border-subtle)",
                    }}
                  >
                    <Tooltip title={head.desc}>
                      <TableSortLabel
                        active={sortConfig.key === head.key}
                        direction={
                          sortConfig.key === head.key
                            ? sortConfig.direction
                            : "asc"
                        }
                        onClick={() =>
                          onSortChange(head.key as keyof PlayerAggregates)
                        }
                      >
                        {head.label}
                      </TableSortLabel>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedStatsGridData.map((row) => (
                <PlayerStatRow
                  key={row.id}
                  jerseyNumber={row.jerseyNumber ?? ""}
                  name={row.name}
                  isOnCourt={draftOnCourtIds.has(String(row.id))}
                  min={row.min}
                  points={row.points}
                  threePM={row.threePM}
                  threePA={row.threePA}
                  threePPct={row.threePPct}
                  ftm={row.ftm}
                  fta={row.fta}
                  ftPct={row.ftPct}
                  rebounds={row.rebounds}
                  assists={row.assists}
                  steals={row.steals}
                  blocks={row.blocks}
                  turnovers={row.turnovers}
                  fouls={row.fouls}
                  plusMinus={row.plusMinus}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MoleskineCard>
    </>
  );
};
