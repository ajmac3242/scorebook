import React from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  Chip,
} from "@mui/material";
import { OpponentAggregates, PlayerAggregates } from "../../utils/stats/types";

interface OpponentScoutingSectionProps {
  opponentStats: (OpponentAggregates & {
    id: string;
    jersey: string;
    isHot: boolean;
    isClutchThreat: boolean;
    straightPoints: number;
  })[];
  opponentName: string;
  players: PlayerAggregates[];
  onCourtIds: Set<string>;
  matchups: Record<string, string>;
  jerseyMap: Map<string, string | undefined>;
  onAssignDefender: (_oppId: string, _defenderId: string) => void;
}

const OpponentScoutingSection: React.FC<OpponentScoutingSectionProps> = ({
  opponentStats,
  opponentName,
  players,
  onCourtIds,
  matchups,
  jerseyMap,
  onAssignDefender,
}) => {
  return (
    <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2 }}>
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{
          fontWeight: 700,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{opponentName} Scouting</span>
        <Chip
          label="Live Tracking"
          size="small"
          color="secondary"
          sx={{ height: 18, fontSize: "0.6rem" }}
        />
      </Typography>

      <Stack spacing={1} sx={{ mt: 2 }}>
        {opponentStats.length > 0 ? (
          opponentStats.map((opp) => (
            <Box
              key={opp.id}
              sx={{
                p: 1.5,
                bgcolor: "white",
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "secondary.main",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {opp.jersey}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700 }}
                    >
                      Opponent #{opp.jersey}
                      {opp.isHot && (
                        <Box
                          component="span"
                          sx={{ ml: 1, fontSize: "1rem" }}
                        >
                          🔥
                        </Box>
                      )}
                      {opp.isClutchThreat && (
                        <Chip
                          label="CLUTCH THREAT"
                          size="small"
                          color="error"
                          sx={{
                            ml: 1,
                            height: 16,
                            fontSize: "0.55rem",
                            fontWeight: 800,
                          }}
                        />
                      )}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {opp.points} pts | {opp.makes}-{opp.attempts} FG
                      | {opp.turnovers} TO
                    </Typography>
                  </Box>
                </Box>
                {opp.straightPoints >= 4 && (
                  <Chip
                    label={`${opp.straightPoints} STRAIGHT`}
                    size="small"
                    color="error"
                    sx={{
                      height: 16,
                      fontSize: "0.55rem",
                      fontWeight: 800,
                    }}
                  />
                )}
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    display: "block",
                    mb: 0.5,
                    color: "text.secondary",
                  }}
                >
                  Primary Defender
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 0.5,
                  }}
                >
                  {players
                    .filter((p) => onCourtIds.has(p.id!.toString()))
                    .map((p) => (
                      <Button
                        key={p.id}
                        variant={
                          matchups[opp.id] === p.id!.toString()
                            ? "contained"
                            : "outlined"
                        }
                        size="small"
                        onClick={() => onAssignDefender(opp.id, p.id!.toString())}
                        sx={{
                          minWidth: 0,
                          p: 0.5,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          height: 24,
                        }}
                      >
                        #{jerseyMap.get(p.id!.toString())}
                      </Button>
                    ))}
                </Box>
              </Box>
            </Box>
          ))
        ) : (
          <Box
            sx={{
              py: 3,
              textAlign: "center",
              border: "1px dashed #ccc",
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              No opponent players tracked yet.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default React.memo(OpponentScoutingSection);
