import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppPageShell from "../components/layout/AppPageShell";
import { useTokens } from "../theme/useTokens";
import { EmptyState } from "../components/feedback";
import { SportsBasketball as GamesIcon } from "@mui/icons-material";

const Games: React.FC = () => {
  const tokens = useTokens();
  const navigate = useNavigate();

  return (
    <AppPageShell title="Games">
      <EmptyState
        icon={
          <GamesIcon
            sx={{
              fontSize: tokens.semantic.component.iconSize.xl,
              color: tokens.semantic.color.text.tertiary,
            }}
          />
        }
        title="Games"
        description="Manage and track your games here. Historical game logs and scheduling are coming soon."
        action={
          <Button
            variant="contained"
            onClick={() => navigate("/teams")}
            sx={{
              textTransform: "none",
              borderRadius: tokens.semantic.component.radius.button,
              fontWeight: tokens.semantic.typography.button.fontWeight,
            }}
          >
            View Teams & Schedule
          </Button>
        }
      />
    </AppPageShell>
  );
};

export default Games;
