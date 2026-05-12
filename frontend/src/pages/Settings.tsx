import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";
import PaletteIcon from "@mui/icons-material/Palette";
import StorageIcon from "@mui/icons-material/Storage";
import SyncIcon from "@mui/icons-material/Sync";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { alpha, useTheme } from "@mui/material/styles";

import { useAppTheme } from "../theme/ThemeContext";

// Adjust these imports to match your app if the paths differ.
import { useAuth } from "../context/AuthContext";
import { subscribeToSyncStatus } from "../services/syncService";
import { getSystemLogs } from "../services/logService";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error";
};

type SyncSnapshot = {
  isSyncing: boolean;
  hasUnsynced: boolean;
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const { presetId, setPresetId, availablePresets } = useAppTheme();
  const { logout } = useAuth();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToSyncStatus?.((snapshot: SyncSnapshot) => {
        setIsSyncing(Boolean(snapshot?.isSyncing));
        setHasUnsynced(Boolean(snapshot?.hasUnsynced));
      });
    } catch {
      // no-op if sync service is unavailable in this environment
    }

    try {
      const nextLogs = getSystemLogs?.() ?? [];
      setLogs(Array.isArray(nextLogs) ? nextLogs : []);
    } catch {
      setLogs([]);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe?.();
    };
  }, []);

  const activePreset = useMemo(
    () => availablePresets.find((preset) => preset.id === presetId),
    [availablePresets, presetId],
  );

  const showSnackbar = (
    message: string,
    severity: SnackbarState["severity"] = "info",
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSelectPreset = (id: string) => {
    setPresetId(id);
    showSnackbar("Theme updated.", "success");
  };

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      setIsCopied(true);
      showSnackbar("System logs copied.", "success");
    } catch {
      showSnackbar("Unable to copy logs.", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
    } catch {
      showSnackbar("Logout failed. Please try again.", "error");
    } finally {
      setLogoutDialogOpen(false);
    }
  };

  const cardRadius =
    (
      theme.shape as typeof theme.shape & {
        borderRadiusLg?: number;
        borderRadiusMd?: number;
      }
    ).borderRadiusLg ??
    (
      theme.shape as typeof theme.shape & {
        borderRadiusMd?: number;
      }
    ).borderRadiusMd ??
    theme.shape.borderRadius;

  const statusItems = [
    {
      label: "Network",
      value: isOnline ? "Online" : "Offline",
      icon: isOnline ? (
        <WifiIcon fontSize="small" />
      ) : (
        <WifiOffIcon fontSize="small" />
      ),
      color: isOnline ? "success" : "warning",
    },
    {
      label: "Sync",
      value: isSyncing ? "Syncing" : "Idle",
      icon: <SyncIcon fontSize="small" />,
      color: isSyncing ? "info" : "default",
    },
    {
      label: "Local changes",
      value: hasUnsynced ? "Pending sync" : "All synced",
      icon: <StorageIcon fontSize="small" />,
      color: hasUnsynced ? "warning" : "success",
    },
  ] as const;

  return (
    <Box
      sx={{
        maxWidth: 960,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage the app appearance, system status, and maintenance tools for{" "}
            {activePreset?.label ? "your Courtsight experience" : "Courtsight"}.
          </Typography>
        </Box>

        <Divider />

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: cardRadius,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  width: 40,
                  height: 40,
                }}
              >
                <PaletteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Appearance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a preset theme for your coaching workflow.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              {availablePresets.map((preset) => {
                const selected = preset.id === presetId;
                const swatches = [
                  preset.tokens.primary,
                  preset.tokens.surface,
                  preset.tokens.background,
                ].filter(Boolean);

                return (
                  <Grid item xs={12} sm={6} md={4} key={preset.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderRadius: cardRadius,
                        borderColor: selected ? "primary.main" : "divider",
                        boxShadow: selected ? theme.shadows[4] : "none",
                        transition: theme.transitions.create(
                          ["border-color", "box-shadow", "transform"],
                          {
                            duration: theme.transitions.duration.shorter,
                          },
                        ),
                        transform: selected ? "translateY(-1px)" : "none",
                        overflow: "hidden",
                      }}
                    >
                      <CardActionArea
                        onClick={() => handleSelectPreset(preset.id)}
                        sx={{
                          height: "100%",
                          alignItems: "stretch",
                          borderRadius: "inherit",
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography variant="subtitle1" fontWeight={700}>
                                {preset.label}
                              </Typography>

                              {selected ? (
                                <CheckCircleIcon
                                  color="primary"
                                  fontSize="small"
                                />
                              ) : null}
                            </Stack>

                            <Stack direction="row" spacing={1}>
                              {swatches.map((color, index) => (
                                <Box
                                  key={`${preset.id}-${index}`}
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    bgcolor: color,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                />
                              ))}
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Chip
                                size="small"
                                label={
                                  preset.mode === "dark" ? "Dark" : "Light"
                                }
                                variant={selected ? "filled" : "outlined"}
                                color={selected ? "primary" : "default"}
                              />
                              {preset.description ? (
                                <Tooltip title={preset.description}>
                                  <Chip
                                    size="small"
                                    label="About"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              ) : null}
                            </Stack>

                            {preset.description ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {preset.description}
                              </Typography>
                            ) : null}
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: cardRadius,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={700}>
              System Status
            </Typography>

            <Grid container spacing={2}>
              {statusItems.map((item) => (
                <Grid item xs={12} sm={4} key={item.label}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      height: "100%",
                      borderRadius: cardRadius,
                      borderColor: "divider",
                      backgroundColor: alpha(
                        theme.palette.background.default,
                        0.5,
                      ),
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(
                              item.color === "success"
                                ? theme.palette.success.main
                                : item.color === "warning"
                                  ? theme.palette.warning.main
                                  : item.color === "info"
                                    ? theme.palette.info.main
                                    : theme.palette.text.secondary,
                              0.12,
                            ),
                            color:
                              item.color === "success"
                                ? "success.main"
                                : item.color === "warning"
                                  ? "warning.main"
                                  : item.color === "info"
                                    ? "info.main"
                                    : "text.secondary",
                          }}
                        >
                          {item.icon}
                        </Avatar>
                        <Typography variant="subtitle2" color="text.secondary">
                          {item.label}
                        </Typography>
                      </Stack>

                      <Typography variant="h6" fontWeight={700}>
                        {item.value}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: cardRadius,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign out of the current device when you are done coaching.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => setLogoutDialogOpen(true)}
            >
              Log out
            </Button>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: cardRadius,
            borderColor: "divider",
            backgroundColor: "background.paper",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  System Logs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review recent diagnostic output and copy it for
                  troubleshooting.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyLogs}
                disabled={!logs.length}
              >
                {isCopied ? "Copied" : "Copy logs"}
              </Button>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: cardRadius,
                borderColor: "divider",
                backgroundColor: alpha(theme.palette.background.default, 0.65),
                minHeight: 180,
                maxHeight: 320,
                overflow: "auto",
              }}
            >
              {logs.length ? (
                <Stack spacing={1}>
                  {logs.map((entry, index) => (
                    <Typography
                      key={`${entry}-${index}`}
                      variant="body2"
                      sx={{
                        fontFamily: theme.typography.fontFamily,
                        color: "text.secondary",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {entry}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No logs available.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: cardRadius,
          },
        }}
      >
        <DialogTitle>Log out?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You will need to sign in again to access Courtsight on this device.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmLogout}
          >
            Log out
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
