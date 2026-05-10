import React from "react";
import {
  Grid,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { MoleskineCard } from "../../components/SharedUI";

interface EfficiencyMetric {
  phase?: string;
  quality?: string;
  name?: string;
  attempts: number;
  points: number;
  efg: string | number;
}

interface EfficiencyAnalyticsProps {
  shotClockEfficiency: EfficiencyMetric[];
  processEfficiency: EfficiencyMetric[];
  playEfficiency: EfficiencyMetric[];
}

const EfficiencyAnalytics: React.FC<EfficiencyAnalyticsProps> = ({
  shotClockEfficiency,
  processEfficiency,
  playEfficiency,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <MoleskineCard>
          <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
            Shot Rhythm (Clock)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Phase</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Freq
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    PTS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    eFG%
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shotClockEfficiency.map((p) => (
                  <TableRow key={p.phase}>
                    <TableCell sx={{ fontWeight: 600 }}>{p.phase}</TableCell>
                    <TableCell align="right">{p.attempts}</TableCell>
                    <TableCell align="right">{p.points}</TableCell>
                    <TableCell align="right">{p.efg}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <MoleskineCard>
          <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
            Process Efficiency
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Quality</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Freq
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    PTS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    eFG%
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processEfficiency.map((p) => (
                  <TableRow key={p.quality}>
                    <TableCell sx={{ fontWeight: 600 }}>{p.quality}</TableCell>
                    <TableCell align="right">{p.attempts}</TableCell>
                    <TableCell align="right">{p.points}</TableCell>
                    <TableCell align="right">{p.efg}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <MoleskineCard>
          <Typography variant="h6" sx={{ fontFamily: "var(--serif)", mb: 2 }}>
            Play Efficiency
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Play</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Freq
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    PTS
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    eFG%
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playEfficiency.map((play) => (
                  <TableRow key={play.name}>
                    <TableCell sx={{ fontWeight: 600 }}>{play.name}</TableCell>
                    <TableCell align="right">{play.attempts}</TableCell>
                    <TableCell align="right">{play.points}</TableCell>
                    <TableCell align="right">{play.efg}%</TableCell>
                  </TableRow>
                ))}
                {playEfficiency.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No play-tagged shots recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </MoleskineCard>
      </Grid>
    </Grid>
  );
};

export default React.memo(EfficiencyAnalytics);
