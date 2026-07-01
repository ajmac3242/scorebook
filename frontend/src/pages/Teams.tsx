import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stack } from "@mui/material";
import AppPageShell from "../components/layout/AppPageShell";
import { PageToolbar } from "../components/layout/PageToolbar";
import { EntityCard } from "../components/cards";
import TeamWorkflowDialog from "../components/teams/TeamWorkflowDialog";
import { EmptyState, PageSnackbar } from "../components/feedback";
import { useTeamsData } from "./Teams/hooks/useTeamsData";
import { usePageSnackbar } from "../hooks/usePageSnackbar";

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();
  const { teams, favoriteId, handleToggleFavorite } = useTeamsData();
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <>
      <AppPageShell>
        <PageToolbar
          title="Teams"
          primaryAction={{
            label: "Create team",
            onClick: () => setOpenCreate(true),
          }}
        />

        {teams.length === 0 ? (
          <EmptyState
            title="No teams yet"
            description="Create your first team to start tracking games and stats."
            action={{ label: "Create team", onClick: () => setOpenCreate(true) }}
          />
        ) : (
          <Stack spacing={1.5}>
            {teams.map((team) => (
              <EntityCard
                key={team.id}
                title={team.name}
                subtitle={team.description}
                avatarSrc={team.logoUrl}
                avatarColor={team.primaryColor}
                isFavorite={team.id === favoriteId}
                onFavoriteToggle={() =>
                  handleToggleFavorite(team.id!, team.id !== favoriteId)
                }
                onClick={() => navigate(`/teams/${team.id}`)}
              />
            ))}
          </Stack>
        )}
      </AppPageShell>

      <TeamWorkflowDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        mode="create"
        onCreated={() => {
          showSnackbar("Team created!", "success");
        }}
      />

      <PageSnackbar {...snackbar} onClose={hideSnackbar} />
    </>
  );
};

export default Teams;
