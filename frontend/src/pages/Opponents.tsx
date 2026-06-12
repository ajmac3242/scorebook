import React, { useMemo, useState } from "react";
import { Box, Button, Grid, useMediaQuery, useTheme } from "@mui/material";
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

type OpponentTab = "active" | "archived";

type OpponentActionTarget = {
  id: string;
  name: string;
  action: "delete" | "archive" | "restore";
} | null;

const TABS: readonly AppPageTab<OpponentTab>[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

const Opponents: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const controlRadius = tokens.semantic.component.radius.button;
  const defaultOpponentAccent = tokens.semantic.color.entity.defaultAccent;

  const [activeTab, setActiveTab] = useState<OpponentTab>("active");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTarget, setActionTarget] = useState<OpponentActionTarget>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const opponentsQueryResult = useLiveQuery(() => db.opponents.toArray(), []);
  const opponents = useMemo(
    () => opponentsQueryResult || [],
    [opponentsQueryResult],
  );

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    setIsProcessing(true);
    try {
      if (actionTarget.action === "delete") {
        await db.opponents.delete(actionTarget.id);
        await syncService.pushUpdates();
        showSnackbar(
          `"${actionTarget.name}" removed from opponent library.`,
          "success",
        );
      } else if (actionTarget.action === "archive") {
        await db.opponents.update(actionTarget.id, {
          isArchived: 1,
          synced: 0,
        });
        await syncService.pushUpdates();
        showSnackbar(`"${actionTarget.name}" archived.`, "success");
      } else {
        await db.opponents.update(actionTarget.id, {
          isArchived: 0,
          synced: 0,
        });
        await syncService.pushUpdates();
        showSnackbar(
          `"${actionTarget.name}" restored to active opponents.`,
          "success",
        );
      }
      setActionTarget(null);
    } catch (err) {
      logger.error("Failed to update opponent", err, { actionTarget });
      showSnackbar("Failed to update opponent. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOpponents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return opponents.filter((o) => {
      const matchesTab =
        activeTab === "active" ? !o.isArchived : Boolean(o.isArchived);
      if (!matchesTab) return false;
      if (!normalizedSearch) return true;
      return [o.name, o.logoUrl || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [opponents, searchTerm, activeTab]);

  const controls = (
    <PageToolbar
      id="opponents-search"
      placeholder="Search opponents"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Add opponent"
      onPrimaryClick={() => setAddDialogOpen(true)}
      controlRadius={controlRadius}
      primaryDisabled={isMobile}
    />
  );

  return (
    <AppPageShell<OpponentTab>
      title="Opponents"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={(tab) => setActiveTab(tab)}
      controls={controls}
      fabProps={
        activeTab === "active"
          ? {
              icon: <AddIcon />,
              "aria-label": "add opponent",
              onClick: () => setAddDialogOpen(true),
            }
          : undefined
      }
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <Box sx={{ width: "100%" }}>
        {filteredOpponents.length === 0 ? (
          <EmptyState
            icon={
              <ScoutingIcon
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
                  ? "No active opponents"
                  : "No archived opponents"
            }
            description={
              searchTerm
                ? "Try adjusting your search or clear the filter."
                : activeTab === "active"
                  ? "Opponents are automatically added when you schedule a game, or add them manually."
                  : "Opponents you archive will appear here."
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
                  onClick={() => setAddDialogOpen(true)}
                >
                  Add first opponent
                </Button>
              ) : null
            }
          />
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {filteredOpponents.map((opponent) => {
              const isArchived = Boolean(opponent.isArchived);
              return (
                <Grid size={{ xs: 12, md: 6, xl: 4 }} key={opponent.id}>
                  <EntityCard
                    title={opponent.name}
                    subtitle={
                      isArchived
                        ? "Archived opponent — tap to restore to active scouting library"
                        : `${opponent.roster?.length || 0} players identified`
                    }
                    accentColor={
                      tokens.semantic.color.entity?.defaultAccent ||
                      defaultOpponentAccent
                    }
                    imageUrl={opponent.logoUrl}
                    fallbackInitials={getInitials(opponent.name)}
                    badgeLabel={isArchived ? "Archived" : undefined}
                    stats={[
                      {
                        label: "Roster",
                        value: String(opponent.roster?.length || 0),
                      },
                    ]}
                    ariaLabel={
                      isArchived
                        ? `Restore ${opponent.name} to active opponents`
                        : `View scouting report for ${opponent.name}`
                    }
                    onClick={() =>
                      isArchived
                        ? setActionTarget({
                            id: opponent.id,
                            name: opponent.name,
                            action: "restore",
                          })
                        : navigate(`/opponents/${opponent.id}/scouting`)
                    }
                    gamesPlayed={0}
                    isFavorite={false}
                    favoriteTooltip={
                      isArchived ? "Delete opponent" : "Archive opponent"
                    }
                    favoriteAriaLabel={
                      isArchived
                        ? `Delete opponent ${opponent.name}`
                        : `Archive opponent ${opponent.name}`
                    }
                    onFavoriteClick={(e) => {
                      e.stopPropagation();
                      setActionTarget({
                        id: opponent.id,
                        name: opponent.name,
                        action: isArchived ? "delete" : "archive",
                      });
                    }}
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

      <AddOpponentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdded={(name) => {
          showSnackbar(`"${name}" added to opponent library.`, "success");
        }}
      />

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={
          actionTarget?.action === "archive"
            ? "Archive Opponent"
            : actionTarget?.action === "restore"
              ? "Restore Opponent"
              : "Delete Opponent"
        }
        description={
          actionTarget?.action === "archive" ? (
            <>
              Archive <strong>{actionTarget?.name}</strong>? This will remove
              them from the Active tab but keep scouting data available for
              later.
            </>
          ) : actionTarget?.action === "restore" ? (
            <>
              Restore <strong>{actionTarget?.name}</strong> to your active
              opponents list?
            </>
          ) : (
            <>
              Are you sure you want to delete{" "}
              <strong>{actionTarget?.name}</strong>? This will remove all
              associated scouting data and cannot be undone.
            </>
          )
        }
        confirmLabel={
          actionTarget?.action === "archive"
            ? "Archive Opponent"
            : actionTarget?.action === "restore"
              ? "Restore Opponent"
              : "Delete Opponent"
        }
        onConfirm={handleConfirmAction}
        onClose={() => setActionTarget(null)}
        destructive={actionTarget?.action === "delete"}
        loading={isProcessing}
      />
    </AppPageShell>
  );
};

export default Opponents;
