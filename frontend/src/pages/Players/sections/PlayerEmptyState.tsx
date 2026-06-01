import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Add as AddIcon, People as PlayersIcon } from "@mui/icons-material";
import { useTokens } from "../../../theme/useTokens";

type PlayerEmptyStateProps = {
  searchTerm: string;
  showArchived: boolean;
  onClearSearch: () => void;
  onAddPlayer: () => void;
};

const PlayerEmptyState: React.FC<PlayerEmptyStateProps> = ({
  searchTerm,
  showArchived,
  onClearSearch,
  onAddPlayer,
}) => {
  const tokens = useTokens();

  const emptyStateTitle = searchTerm
    ? `No players matching "${searchTerm}"`
    : showArchived
      ? "No players yet"
      : "No active players";

  const emptyStateDescription = searchTerm
    ? "Try a different search or clear the filter."
    : showArchived
      ? "Add your first player to start tracking individual performance."
      : "You have no active players right now. Try showing archived players or add a new player.";

  return (
    <Box
      sx={{
        minHeight: 320,
        borderRadius: tokens.semantic.component.sectionCard.radius,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        py: 6,
      }}
    >
      <Box>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            mx: "auto",
            mb: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
            color: "text.secondary",
          }}
        >
          <PlayersIcon />
        </Box>

        <Typography variant="h6" sx={{ mb: 1 }}>
          {emptyStateTitle}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 480, mx: "auto", mb: 3 }}
        >
          {emptyStateDescription}
        </Typography>

        {searchTerm ? (
          <Button
            variant="outlined"
            onClick={onClearSearch}
            sx={{ borderRadius: tokens.semantic.component.radius.button }}
          >
            Clear search
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddPlayer}
            sx={{
              borderRadius: tokens.semantic.component.radius.button,
              boxShadow: "none",
            }}
          >
            Create first player
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default PlayerEmptyState;
