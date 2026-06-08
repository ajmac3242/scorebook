import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Fab,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Assessment as ScoutingIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { getInitials } from "../utils/stats";
import { logger } from "../utils/logger";
import { syncService } from "../utils/syncService";
import { useTokens } from "../theme/useTokens";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import { PageToolbar } from "../components/layout/PageToolbar";
import { EntityCard } from "../components/cards";
import { EmptyState, PageSnackbar } from "../components/feedback";
import { ConfirmDialog } from "../components/dialogs";
import { usePageSnackbar } from "../hooks/usePageSnackbar";
import AddOpponentDialog from "./Opponents/AddOpponentDialog";

type OpponentTab = "all";

const TABS: readonly AppPageTab<OpponentTab>[] = [
  { value: "all", label: "All" },
] as const;

/* Opponents use a neutral blue-grey accent since they don't carry
   custom brand colors the way coached teams do. */
const DEFAULT_OPPONENT_ACCENT = "#546E7A";

const Opponents: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const controlRadius = tokens.semantic.component.radius.button;
  const cardRadius = Math.max(tokens.semantic.component.sectionCard.radius, 20);

  const [activeTab, setActiveTab] = useState<OpponentTab>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const opponentsQueryResult = useLiveQuery(() => db.opponents.toArray(), []);
  const opponents = useMemo(
    () => opponentsQueryResult || [],
    [opponentsQueryResult],
  );

  const handleDeleteOpponent = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await db.opponents.delete(deleteTarget.id);
      await syncService.pushUpdates();
      showSnackbar(
        `"${deleteTarget.name}" removed from opponent library.`,
        "success",
      );
      setDeleteTarget(null);
    } catch (err) {
      logger.error("Failed to delete opponent", err);
      showSnackbar("Failed to delete opponent. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOpponents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return opponents;
    return opponents.filter((o) =>
      [o.name, o.logoUrl || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [opponents, searchTerm]);

  const controls = (
    <PageToolbar
      id="opponents-search"
      placeholder="Search opponents"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Add opponent"
      onPrimaryClick={() => setAddDialogOpen(true)}
      controlRadius={controlRadius}
    />
  );

  return (
    <AppPageShell<OpponentTab>
      title="Opponents"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <Box sx={{ width: "100%" }}>
        {filteredOpponents.length === 0 ? (
          <EmptyState
            icon={
              <ScoutingIcon sx={{ fontSize: 40, color: "text.tertiary" }} />
            }
            title={
              searchTerm
                ? `No results for "${searchTerm}"`
                : "No opponents tracked yet"
            }
            description={
              searchTerm
                ? "Try adjusting your search or clear the filter."
                : "Opponents are automatically added when you schedule a game, or add them manually."
            }
            action={
              searchTerm ? (
                <Button
                  variant="outlined"
                  onClick={() => setSearchTerm("")}
                  sx={{
                    borderRadius: controlRadius,
                    textTransform: "none",
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                  }}
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  sx={{
                    borderRadius: controlRadius,
                    textTransform: "none",
                    fontWeight: tokens.semantic.typography.button.fontWeight,
                    boxShadow: "none",
                    px: `${tokens.semantic.spacing.md}px`,
                  }}
                >
                  Add Your First Opponent
                </Button>
              )
            }
          />
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {filteredOpponents.map((opponent) => (
              <Grid size={{ xs: 12, md: 6, xl: 4 }} key={opponent.id}>
                <EntityCard
                  title={opponent.name}
                  subtitle={`${opponent.roster?.length || 0} players identified`}
                  accentColor={DEFAULT_OPPONENT_ACCENT}
                  imageUrl={opponent.logoUrl}
                  fallbackInitials={getInitials(opponent.name)}
                  stats={[
                    {
                      label: "Roster",
                      value: String(opponent.roster?.length || 0),
                    },
                  ]}
                  ariaLabel={`View scouting report for ${opponent.name}`}
                  onClick={() =>
                    navigate(`/opponents/${opponent.id}/scouting`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/opponents/${opponent.id}/scouting`);
                    }
                  }}
                  cardRadius={cardRadius}
                  /* Opponents don't have win-loss records — always show the
                     no-games state so the card height stays consistent. */
                  gamesPlayed={0}
                  isFavorite={false}
                  favoriteTooltip="Delete opponent"
                  favoriteAriaLabel={`Delete Opponent ${opponent.name}`}
                  onFavoriteClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: opponent.id, name: opponent.name });
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Mobile FAB — matches Teams page pattern */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add opponent"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            boxShadow: theme.shadows[6],
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <AddOpponentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={(name) => {
          showSnackbar(`"${name}" added to opponent library.`, "success");
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Opponent"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>? This will remove all
            associated scouting data and cannot be undone.
          </>
        }
        confirmLabel="Delete Opponent"
        onConfirm={handleDeleteOpponent}
        onClose={() => setDeleteTarget(null)}
        destructive
        loading={isDeleting}
      />
    </AppPageShell>
  );
};

export default Opponents;
