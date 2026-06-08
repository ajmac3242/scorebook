import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../utils/stats";
import { PageSnackbar } from "../components/feedback";
import { usePageSnackbar } from "../hooks/usePageSnackbar";
import { useTokens } from "../theme/useTokens";
import AppPageShell from "../components/layout/AppPageShell";
import { PageToolbar } from "../components/layout/PageToolbar";
import PageSectionCard from "../components/layout/PageSectionCard";
import { EntityCard } from "../components/cards";
import {
  usePlayersData,
  AddPlayerDialog,
  PlayerEmptyState,
} from "./Players/index";

const Players: React.FC = () => {
  const tokens = useTokens();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const {
    playersWithStats,
    starCount,
    archivedCount,
    handleRestorePlayer,
    handleToggleStar,
  } = usePlayersData({ searchTerm, showArchived, showSnackbar });

  return (
    <AppPageShell
      title="Players"
      controls={
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          aria-label="add new player"
          onClick={() => setOpen(true)}
          sx={{
            borderRadius: tokens.semantic.component.radius.button,
            px: 2,
            boxShadow: "none",
          }}
        >
          Add player
        </Button>
      }
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <PageSectionCard sx={{ p: 0, overflow: "hidden" }}>
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: "stretch" }}>
            <PageToolbar
              id="players-search"
              placeholder="Search players"
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              primaryLabel="Add player"
              onPrimaryClick={() => setOpen(true)}
              controlRadius={tokens.semantic.component.radius.button}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              sx={{
                alignItems: { xs: "stretch", sm: "center" },
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`${playersWithStats.length} shown`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <Chip
                label={`${starCount} starred`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <Chip
                label={`${archivedCount} archived`}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    slotProps={{
                      input: { "aria-label": "show archived players" },
                    }}
                  />
                }
                label="Show archived"
                sx={{
                  ml: { xs: 0, sm: 0.5 },
                  mr: 0,
                  color: "text.secondary",
                  "& .MuiFormControlLabel-label": {
                    fontSize: tokens.semantic.typography.body2.fontSize,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          {playersWithStats.length === 0 ? (
            <PlayerEmptyState
              searchTerm={searchTerm}
              showArchived={showArchived}
              onClearSearch={() => setSearchTerm("")}
              onAddPlayer={() => setOpen(true)}
            />
          ) : (
            <Grid container spacing={2.5}>
              {playersWithStats.map((player) => (
                <Grid key={player.id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <EntityCard
                    title={player.name}
                    fallbackInitials={getInitials(player.name)}
                    subtitle={
                      player.isArchived
                        ? "Archived player — select to restore to active roster"
                        : "Track performance and view detailed individual stats"
                    }
                    accentColor={
                      player.avatarColor ??
                      "var(--cs-semantic-color-brand-primary-main)"
                    }
                    badgeLabel={player.isArchived ? "Archived" : undefined}
                    isFavorite={Boolean(player.isStar)}
                    favoriteTooltip={
                      player.isStar
                        ? "Remove star player"
                        : "Mark as star player"
                    }
                    favoriteAriaLabel={
                      player.isStar
                        ? `Remove ${player.name} from starred players`
                        : `Mark ${player.name} as star player`
                    }
                    onFavoriteClick={(e) =>
                      handleToggleStar(e, player.id!, player.isStar)
                    }
                    stats={[
                      {
                        label: "PPG",
                        value: String(player.ppg),
                      },
                      {
                        label: "RPG",
                        value: String(player.rpg),
                      },
                      {
                        label: "APG",
                        value: String(player.apg),
                      },
                    ]}
                    gamesPlayed={player.isArchived ? 0 : 1}
                    onClick={() =>
                      player.isArchived
                        ? handleRestorePlayer(player.id!)
                        : navigate(`/players/${player.id}`)
                    }
                    ariaLabel={
                      player.isArchived
                        ? `Restore ${player.name}`
                        : `View player dashboard for ${player.name}`
                    }
                    cardRadius={tokens.semantic.component.sectionCard.radius}
                    sx={{
                      opacity: player.isArchived ? 0.72 : 1,
                      width: "100%",
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </PageSectionCard>

      <AddPlayerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(msg) => showSnackbar(msg, "success")}
        onError={(msg) => showSnackbar(msg, "error")}
      />
    </AppPageShell>
  );
};

export default Players;
