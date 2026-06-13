import React from "react";
import { Typography, Stack, Button } from "@mui/material";
import { Add as AddIcon, Assessment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import PageSectionCard from "../../../components/layout/PageSectionCard";
import { useTokens } from "../../../theme/useTokens";
import { Team } from "../../../db";

interface QuickActionsSectionProps {
  favoriteTeam: Team;
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  favoriteTeam,
}) => {
  const navigate = useNavigate();
  const tokens = useTokens();

  return (
    <PageSectionCard
      sx={{
        bgcolor: favoriteTeam.primaryColor || "primary.main",
        color: "white",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: tokens.semantic.typography.h6.fontWeight,
          mb: 2,
        }}
      >
        Quick Actions
      </Typography>
      <Stack spacing={1.5}>
        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: alpha("#ffffff", 0.2),
            "&:hover": { bgcolor: alpha("#ffffff", 0.3) },
          }}
          startIcon={<AddIcon />}
          onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
        >
          Schedule New Game
        </Button>
        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: alpha("#ffffff", 0.2),
            "&:hover": { bgcolor: alpha("#ffffff", 0.3) },
          }}
          startIcon={<Assessment />}
          onClick={() => navigate(`/teams/${favoriteTeam.id}`)}
        >
          Manage Roster
        </Button>
      </Stack>
    </PageSectionCard>
  );
};

export default QuickActionsSection;
