import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  InputAdornment,
  Snackbar,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
import { useTokens } from "../theme/useTokens";
import AppPageShell from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import {
  usePlayersData,
  AddPlayerDialog,
  PlayerEmptyState,
  PlayerGridCard,
} from "./Players/index";

const Players: React.FC = () => {
  const tokens = useTokens();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const {
    playersWithStats,
    starCount,
    archivedCount,
    handleRestorePlayer,
    handleToggleStar,
  } = usePlayersData({ searchTerm, showArchived, setSnackbar });

  return (
    <AppPageShell
      title="Players"
      description="Manage your roster, highlight star players, and open individual dashboards."
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

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
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { xs: "stretch", lg: "center" },
              justifyContent: "space-between",
            }}
          >
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players"
              size="small"
              sx={{
                width: { xs: "100%", md: 320 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: tokens.semantic.component.radius.button,
                  bgcolor: "background.paper",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ color: "text.secondary", fontSize: 18 }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
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
                    fontSize: "var(--cs-typography-fontSize-sm)",
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
                <PlayerGridCard
                  key={player.id}
                  player={player}
                  handleRestorePlayer={handleRestorePlayer}
                  handleToggleStar={handleToggleStar}
                />
              ))}
            </Grid>
          )}
        </Box>
      </PageSectionCard>

      <AddPlayerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(msg) =>
          setSnackbar({ open: true, message: msg, severity: "success" })
        }
        onError={(msg) =>
          setSnackbar({ open: true, message: msg, severity: "error" })
        }
      />
    </AppPageShell>
  );
};

export default Players;
