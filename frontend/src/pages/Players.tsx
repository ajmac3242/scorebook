import React, { useState } from "react";
import { Box, Button, Grid, useMediaQuery, useTheme } from "@mui/material";
import { Add as AddIcon, Person as PlayerIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../utils/stats";
import { PageSnackbar } from "../components/feedback";
import { usePageSnackbar } from "../hooks/usePageSnackbar";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import { PageToolbar } from "../components/layout/PageToolbar";
import { EntityCard } from "../components/cards";
import { EmptyState } from "../components/feedback";
import { usePlayersData, AddPlayerDialog } from "./Players/index";

type PlayerTab = "active" | "archived";

const TABS: readonly AppPageTab<PlayerTab>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

const Players: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeTab, setActiveTab] = useState<PlayerTab>("active");
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const { playersWithStats, handleRestorePlayer, handleToggleStar } =
    usePlayersData({ searchTerm, activeTab, showSnackbar });

  const controls = (
    <PageToolbar
      id="players-search"
      placeholder="Search players"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Add player"
      onPrimaryClick={() => setOpen(true)}
      primaryDisabled={isMobile}
      primaryProps={{ "aria-haspopup": "dialog" }}
    />
  );

  return (
    <AppPageShell<PlayerTab>
      title="Players"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
      fabProps={
        activeTab === "active"
          ? {
              icon: <AddIcon />,
              "aria-label": "add player",
              onClick: () => setOpen(true),
              "aria-haspopup": "dialog",
            }
          : undefined
      }
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <Box sx={{ width: "100%" }}>
        {playersWithStats.length === 0 ? (
          <EmptyState
            icon={
              <PlayerIcon
                sx={{
                  fontSize: tokens.semantic.component.iconSize.xl,
                  color: "text.tertiary",
                }}
              />
            }
            title={
              searchTerm
                ? `No results for "${searchTerm}"`
                : activeTab === "active"
                  ? "No active players"
                  : "No archived players"
            }
            description={
              searchTerm
                ? "Try adjusting your search to find who you're looking for."
                : activeTab === "active"
                  ? "Add players to start tracking performance and stats."
                  : "Players you archive will appear here. Tap any archived player to restore them."
            }
            action={
              searchTerm ? (
                <Button variant="outlined" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              ) : activeTab === "active" ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpen(true)}
                  sx={{
                    px: `${tokens.semantic.spacing.md}px`,
                  }}
                >
                  Add first player
                </Button>
              ) : null
            }
          />
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {playersWithStats.map((player) => {
              const isArchived = Boolean(player.isArchived);

              return (
                <Grid key={player.id} size={{ xs: 12, md: 6, xl: 4 }}>
                  <EntityCard
                    title={player.name}
                    fallbackInitials={getInitials(player.name)}
                    subtitle={
                      isArchived
                        ? "Archived — tap to restore to active roster"
                        : "Track performance and view detailed individual stats"
                    }
                    accentColor={
                      player.avatarColor ??
                      tokens.semantic.color.brand.primary.main
                    }
                    badgeLabel={isArchived ? "Archived" : undefined}
                    isFavorite={Boolean(player.isStar)}
                    favoriteTooltip={
                      player.isStar ? "Remove star" : "Mark as star player"
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
                      { label: "PPG", value: String(player.ppg) },
                      { label: "RPG", value: String(player.rpg) },
                      { label: "APG", value: String(player.apg) },
                    ]}
                    gamesPlayed={player.gamesPlayed ?? 0}
                    onClick={() =>
                      isArchived
                        ? handleRestorePlayer(player.id!)
                        : navigate(`/players/${player.id}`)
                    }
                    ariaLabel={
                      isArchived
                        ? `Restore ${player.name} to active roster`
                        : `View player dashboard for ${player.name}`
                    }
                    sx={{
                      opacity: isArchived ? 0.72 : 1,
                      width: "100%",
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

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
