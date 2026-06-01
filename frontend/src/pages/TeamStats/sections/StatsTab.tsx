import React from "react";
import {
  Avatar,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  Groups as GroupsIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { PlayerAggregates } from "../../../utils/stats/types";
import { STAT_ACRONYMS } from "../../../constants/stats";
import { getInitials } from "../../../utils/stats";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import PageSectionIntro from "../../../components/layout/PageSectionIntro";
import { MoleskineCard } from "../../../components/SharedUI";
import SortableHeader from "../../../components/SortableHeader";
import EmptyState from "../../../components/EmptyState";
import { useTokens } from "../../../theme/useTokens";

type StatsTabProps = {
  playerStats: PlayerAggregates[];
  statView: "total" | "average";
  setStatView: (_v: "total" | "average") => void;
  gameIds: string[];
  teamId: string | undefined;
  controlRadius: number;
  sortConfig: { key: string; direction: "asc" | "desc" };
  handleSort: (_key: string) => void;
  tokens: ReturnType<typeof useTokens>;
};

const StatsTab: React.FC<StatsTabProps> = ({
  playerStats,
  statView,
  setStatView,
  gameIds,
  teamId,
  controlRadius,
  sortConfig,
  handleSort,
  tokens,
}) => {
  const navigate = useNavigate();
  const sectionPadding = { xs: 2.5, md: 0 };

  return (
    <PageSectionCard sx={{ p: 0 }}>
      <Box sx={{ p: sectionPadding }}>
        <Box sx={{ mb: 3 }}>
          <PageSectionIntro
            title="Player performance"
            description="Review player production across the selected analytics window."
          />
        </Box>

        {playerStats.length === 0 ? (
          <EmptyState
            icon={<GroupsIcon sx={{ fontSize: 30 }} />}
            title="No player stats yet"
            description="Player performance will appear here once you track completed games for this team."
          />
        ) : (
          <>
            <Box
              sx={{ display: "flex", justifyContent: "flex-start", mb: 1.5 }}
            >
              <ToggleButtonGroup
                value={statView}
                exclusive
                onChange={(_, val) => val && setStatView(val)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    borderRadius: `${controlRadius}px !important`,
                    px: 1.75,
                  },
                }}
              >
                <ToggleButton value="total">Totals</ToggleButton>
                <ToggleButton value="average">Averages</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TableContainer
              component={MoleskineCard}
              sx={{
                p: 0,
                overflowX: "auto",
                mx: { xs: -2.5, md: 0 },
                width: { xs: "calc(100% + 40px)", md: "100%" },
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{ bgcolor: "var(--cs-semantic-color-surface-subtle)" }}
                  >
                    <SortableHeader
                      label="#"
                      sortKey="jerseyNumber"
                      align="left"
                      hideOnMobile
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="PLAYER"
                      sortKey="name"
                      align="left"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="GP"
                      sortKey="gp"
                      align="center"
                      hideOnMobile
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Games Played"
                    />
                    <SortableHeader
                      label="MIN"
                      sortKey="min"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Minutes Played"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.POINTS}
                      sortKey="points"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Points"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.THREE_POINTERS_MADE}
                      sortKey="threePM"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="3-Pointers Made"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.THREE_POINTERS_ATTEMPTED}
                      sortKey="threePA"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="3-Pointers Attempted"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.THREE_POINTER_PERCENTAGE}
                      sortKey="threePPct"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="3-Pointer Percentage"
                    />
                    <SortableHeader
                      label="FG%"
                      sortKey="fgPct"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Field Goal Percentage"
                    />
                    <SortableHeader
                      label="eFG%"
                      sortKey="efgPct"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Effective Field Goal Percentage"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.REBOUNDS}
                      sortKey="rebounds"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Rebounds"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.ASSISTS}
                      sortKey="assists"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Assists"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.STEALS}
                      sortKey="steals"
                      hideOnMobile
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Steals"
                    />
                    <SortableHeader
                      label={STAT_ACRONYMS.TURNOVERS}
                      sortKey="turnovers"
                      hideOnMobile
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Turnovers"
                    />
                    <SortableHeader
                      label="+/-"
                      sortKey="plusMinus"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                      tooltip="Plus/Minus"
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerStats.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        cursor: "pointer",
                        "&:nth-of-type(odd)": {
                          bgcolor: "background.paper",
                        },
                        "&:nth-of-type(even)": {
                          bgcolor: "var(--cs-semantic-color-surface-subtle)",
                        },
                      }}
                      onClick={() =>
                        navigate(`/players/${row.id}?teamId=${teamId}`)
                      }
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          display: { xs: "none", sm: "table-cell" },
                          fontSize: "var(--cs-typography-fontSize-xs)",
                        }}
                      >
                        {row.jerseyNumber ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: row.avatarColor || "grey.500",
                              width: { xs: 28, sm: 40 },
                              height: { xs: 28, sm: 40 },
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: {
                                  xs: "var(--cs-typography-fontSize-xs)",
                                  sm: "var(--cs-typography-fontSize-sm)",
                                },
                              }}
                            >
                              {getInitials(row.name)}
                            </Typography>
                          </Avatar>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: {
                                xs: "var(--cs-typography-fontSize-xs)",
                                sm: "var(--cs-typography-fontSize-sm)",
                              },
                            }}
                          >
                            {row.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      >
                        {row.gp}
                      </TableCell>
                      <TableCell align="right">{row.min}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          color: "var(--cs-semantic-color-stats-offensive)",
                        }}
                      >
                        {row.points}
                      </TableCell>
                      <TableCell align="right">{row.threePM}</TableCell>
                      <TableCell align="right">{row.threePA}</TableCell>
                      <TableCell align="right">{row.threePPct}%</TableCell>
                      <TableCell align="right">{row.fgPct}%</TableCell>
                      <TableCell align="right">{row.efgPct}%</TableCell>
                      <TableCell align="right">{row.rebounds}</TableCell>
                      <TableCell align="right">{row.assists}</TableCell>
                      <TableCell
                        align="right"
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      >
                        {row.steals}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      >
                        {row.turnovers}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {row.plusMinus > 0
                          ? `+${row.plusMinus}`
                          : row.plusMinus}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {gameIds.length === 0 && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 1.5,
                  borderRadius: `${tokens.semantic.component.sectionCard.radius}px`,
                  bgcolor: "var(--cs-semantic-color-surface-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <InfoOutlinedIcon
                  sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Stats will populate once you track completed games for this
                  team.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </PageSectionCard>
  );
};

export default StatsTab;
