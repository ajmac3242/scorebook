import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Box, Typography, useTheme } from "@mui/material";
import { TeamAggregates } from "../utils/stats";

interface IdentityRadarChartProps {
  currentGame: TeamAggregates & { pace: number };
  seasonAvg: TeamAggregates & { pace: number };
}

const IdentityRadarChart: React.FC<IdentityRadarChartProps> = ({
  currentGame,
  seasonAvg,
}) => {
  const theme = useTheme();

  // Normalize data for Radar Chart (0-100 scale)
  // Most of these are already percentages or can be scaled.
  // Pace needs normalization relative to a baseline (e.g., 100)
  const data = [
    {
      subject: "Pace",
      current: currentGame.pace,
      average: seasonAvg.pace,
      fullMark: 100,
    },
    {
      subject: "eFG%",
      current: parseFloat(currentGame.efgPct || "0"),
      average: parseFloat(seasonAvg.efgPct || "0"),
      fullMark: 100,
    },
    {
      subject: "TO%",
      current: parseFloat(currentGame.toPct || "0"),
      average: parseFloat(seasonAvg.toPct || "0"),
      fullMark: 100,
    },
    {
      subject: "ORB%",
      current: parseFloat(currentGame.orbPct || "0"),
      average: parseFloat(seasonAvg.orbPct || "0"),
      fullMark: 100,
    },
    {
      subject: "FT Rate",
      current: parseFloat(currentGame.ftRate || "0"),
      average: parseFloat(seasonAvg.ftRate || "0"),
      fullMark: 100,
    },
  ];

  return (
    <Box sx={{ width: "100%", height: 300, mt: 2 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 800, mb: 1, display: "block", textAlign: "center", color: "text.secondary" }}
      >
        TEAM IDENTITY RADAR (BLUEPRINT VS LIVE)
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Current Game"
            dataKey="current"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.6}
          />
          <Radar
            name="Season Average"
            dataKey="average"
            stroke={theme.palette.secondary.main}
            fill={theme.palette.secondary.main}
            fillOpacity={0.3}
            strokeDasharray="4 4"
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default IdentityRadarChart;
