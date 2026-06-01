import React from "react";
import {
  Avatar,
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Groups as GroupsIcon } from "@mui/icons-material";
import { LineupAggregates } from "../../../utils/stats/types";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import PageSectionIntro from "../../../components/layout/PageSectionIntro";
import { MoleskineCard } from "../../../components/SharedUI";
import SortableHeader from "../../../components/SortableHeader";
import EmptyState from "../../../components/EmptyState";

type LineupsTabProps = {
  lineupStats: LineupAggregates[];
  localJerseyNumbers: Record<string, string>;
  sortedRosterJerseyMap: Map<string, string>;
  lineupSortConfig: { key: string; direction: "asc" | "desc" };
  handleLineupSort: (_key: string) => void;
  controlRadius: number;
};

const LineupsTab: React.FC<LineupsTabProps> = ({
  lineupStats,
  localJerseyNumbers,
  sortedRosterJerseyMap,
  lineupSortConfig,
  handleLineupSort,
}) => {
  const sectionPadding = { xs: 2.5, md: 0 };

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Lineup efficiency"
            description="Compare lineup combinations by scoring margin, minutes, and net production."
          />
        </Box>

        {lineupStats.length === 0 ? (
          <EmptyState
            icon={<GroupsIcon sx={{ fontSize: 30 }} />}
            title="No lineup data yet"
            description="Track completed games to unlock lineup combinations and net rating insights."
          />
        ) : (
          <TableContainer component={MoleskineCard} sx={{ p: 0, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Lineup</TableCell>
                  <SortableHeader
                    label="MIN"
                    sortKey="seconds"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="PTS FOR"
                    sortKey="pointsFor"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="PTS AGN"
                    sortKey="pointsAgainst"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="NET/40"
                    sortKey="netRatingPer40"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                  <SortableHeader
                    label="+/-"
                    sortKey="netRating"
                    sortConfig={lineupSortConfig}
                    onSort={handleLineupSort}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {lineupStats.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {row.lineup.map((pId) => (
                          <Avatar
                            key={pId}
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: "var(--cs-typography-fontSize-xs)",
                              bgcolor: "action.hover",
                              color: "text.primary",
                              fontWeight: 700,
                            }}
                          >
                            {localJerseyNumbers[pId] || sortedRosterJerseyMap.get(pId) || "??"}
                          </Avatar>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{(row.seconds / 60).toFixed(1)}</TableCell>
                    <TableCell align="right">{row.pointsFor}</TableCell>
                    <TableCell align="right">{row.pointsAgainst}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {row.netRatingPer40}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                        color:
                          row.netRating > 0
                            ? "success.main"
                            : row.netRating < 0
                              ? "error.main"
                              : "text.primary",
                      }}
                    >
                      {row.netRating > 0 ? `+${row.netRating}` : row.netRating}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </PageSectionCard>
  );
};

export default LineupsTab;
