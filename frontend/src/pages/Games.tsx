import React from "react";
import AppPageShell from "../components/layout/AppPageShell";
import { useTokens } from "../theme/useTokens";
import { EmptyState } from "../components/feedback";
import { SportsBasketball as GamesIcon } from "@mui/icons-material";

const Games: React.FC = () => {
  const tokens = useTokens();

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
      />
    </AppPageShell>
  );
};

export default Games;
