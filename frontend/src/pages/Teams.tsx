import React, { useMemo, useState } from "react";
import { Button, useMediaQuery, useTheme } from "@mui/material";
import { Add as AddIcon, Groups as TeamsIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { getInitials } from "../utils/stats";
import { useTokens } from "../theme/useTokens";
import { EntityGridPage } from "../components/layout/EntityGridPage";
import { EntityCard } from "../components/cards";
import CreateTeamWorkflow from "../components/teams/CreateTeamWorkflow";
import { PageSnackbar } from "../components/feedback";
import { useTeamsData } from "./Teams/hooks/useTeamsData";
import { usePageSnackbar } from "../hooks/usePageSnackbar";

type TeamTab = "active" | "archived";

const TABS: readonly { value: TeamTab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

const isValidHex = (value?: string) =>
  !!value && /^#([0-9A-F]{6})$/i.test(value.trim());

const Teams: React.FC = () => {
  const tokens = useTokens();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const defaultTeamAccent =
    tokens.semantic.color.entity.defaultAccent ||
    tokens.semantic.color.brand.primary.dark;

  const [activeTab, setActiveTab] = useState<TeamTab>("active");
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const teams = useTeams();

  const { teamAggregatesMap, handleToggleDefault } = useTeamsData({
    teams,
    showSnackbar,
  });

  const visibleTeams = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = teams.filter((team) => {
      const matchesTab =
        activeTab === "active" ? !team.isArchived : Boolean(team.isArchived);

      if (!matchesTab) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        team.name,
        team.description || "",
        team.periodType || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    if (activeTab === "active") {
      filtered.sort((a, b) => {
        const aDefault = Boolean(a.isFavorite);
        const bDefault = Boolean(b.isFavorite);
        if (aDefault && !bDefault) return -1;
        if (!aDefault && bDefault) return 1;
        return 0;
      });
    }

    return filtered;
  }, [activeTab, teams, searchTerm]);

  return (
    <EntityGridPage<TeamTab, (typeof teams)[0]>
      title="Teams"
      activeTab={activeTab}
      tabs={TABS}
      onTabChange={setActiveTab}
      searchPlaceholder="Search teams"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      primaryLabel="Create team"
      onPrimaryClick={() => setWorkflowOpen(true)}
      primaryDisabled={isMobile}
      items={visibleTeams}
      fabIcon={<AddIcon />}
      fabAriaLabel="create team"
      emptyIcon={
        <TeamsIcon
          sx={{
            fontSize: tokens.semantic.component.iconSize.xl,
            color: tokens.semantic.color.text.tertiary,
          }}
        />
      }
      emptyTitle={
        searchTerm
          ? `No results for "${searchTerm}"`
          : activeTab === "active"
            ? "No active teams"
            : "No archived teams"
      }
      emptyDescription={
        searchTerm
          ? "Try adjusting your search or filters to find what you're looking for."
          : activeTab === "active"
            ? "Start by creating your first team to track performance and manage rosters."
            : "Teams you archive will appear here."
      }
      emptyAction={
        searchTerm ? (
          <Button variant="outlined" onClick={() => setSearchTerm("")}>
            Clear search
          </Button>
        ) : activeTab === "active" ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setWorkflowOpen(true)}
          >
            Create first team
          </Button>
        ) : null
      }
      renderCard={(team) => {
        const aggregates = teamAggregatesMap[team.id!] || {
          record: "0-0",
          ppg: "0.0",
          rpg: "0.0",
          apg: "0.0",
          oppg: "0.0",
          gamesPlayed: 0,
        };

        const accentColor = isValidHex(team.primaryColor)
          ? team.primaryColor!.trim()
          : defaultTeamAccent;

        const isDefault = Boolean(team.isFavorite);

        return (
          <EntityCard
            title={team.name}
            subtitle={team.description}
            accentColor={accentColor}
            imageUrl={team.logoUrl}
            fallbackInitials={getInitials(team.name)}
            isFavorite={isDefault}
            favoriteTooltip={
              isDefault ? "Default team — tap to unset" : "Set as default team"
            }
            favoriteAriaLabel={
              isDefault
                ? `${team.name} is your default team. Tap to unset.`
                : `Set ${team.name} as your default team`
            }
            onFavoriteClick={(event) =>
              handleToggleDefault(team.id!, team.isFavorite || 0, event)
            }
            highlightValue={aggregates.record}
            highlightLabel="Win-loss record"
            stats={[
              { label: "PPG", value: aggregates.ppg },
              { label: "RPG", value: aggregates.rpg },
              { label: "APG", value: aggregates.apg },
              { label: "OPPG", value: aggregates.oppg },
            ]}
            ariaLabel={`View team dashboard for ${team.name}`}
            onClick={() => navigate(`/teams/${team.id}`)}
            gamesPlayed={aggregates.gamesPlayed}
          />
        );
      }}
    >
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />

      <CreateTeamWorkflow
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        onCreated={() => {
          setWorkflowOpen(false);
          showSnackbar("Team created successfully!", "success");
        }}
      />
    </EntityGridPage>
  );
};

export default Teams;
