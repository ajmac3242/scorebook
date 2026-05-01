import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Avatar,
  keyframes,
} from "@mui/material";
import {
  Security as SecurityIcon,
} from "@mui/icons-material";
import { MoleskineCard } from "../SharedUI";
import { MatchupStats } from "../../utils/stats/types";
import { calculatePpp } from "../../utils/stats";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

export interface TargetAttackHUDProps {
  matchups: MatchupStats[];
}

export const TargetAttackHUD: React.FC<TargetAttackHUDProps> = ({ matchups }) => {
  const target = useMemo(() => {
    return [...matchups]
              .filter((m: MatchupStats) => m.isOpponentDefender && m.possessions >= 2)
      .sort((a, b) => {
        const pppA = parseFloat(calculatePpp(a.pointsAllowed, a.possessions));
        const pppB = parseFloat(calculatePpp(b.pointsAllowed, b.possessions));
        return pppB - pppA;
      })[0];
  }, [matchups]);

  if (!target) return null;

    const oppJersey = target.oppPlayerId.split(":")[1] || "??";
  const ppp = calculatePpp(target.pointsAllowed, target.possessions);
    const isMismatch = parseFloat(target.stopPct ?? "100") < 30 && target.possessions >= 3;

  return (
    <MoleskineCard
      sx={{
        border: isMismatch ? "2px solid #ff1744" : "1px solid rgba(0,0,0,0.12)",
        animation: isMismatch ? `${pulse} 2s infinite ease-in-out` : "none",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <SecurityIcon sx={{ fontSize: 18, color: "secondary.main" }} /> TARGET ATTACK
        </Typography>
        {isMismatch && (
          <Chip label="MISMATCH" size="small" color="error" sx={{ fontWeight: 900, height: 20, fontSize: "0.6rem" }} />
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40, fontWeight: 800 }}>
          {oppJersey}
        </Avatar>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Opponent #{oppJersey}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                        Allowing {ppp} PPP | {target.stopPct}% Stop Rate
          </Typography>
        </Box>
      </Box>
    </MoleskineCard>
  );
};
