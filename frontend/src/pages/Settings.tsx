import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Avatar,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Refresh as SyncingIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as ClearIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger, type LogEntry } from "../utils/logger";
import EntityBanner from "../components/EntityBanner";
import { db } from "../db";

/**
 * Settings page component.
 * Displays system status and provides account management options.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [clearLogsDialogOpen, setClearLogsDialogOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    syncService.hasUnsyncedChanges().then(setHasUnsynced);

    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
      // Re-check unsynced status when sync state changes
      syncService.hasUnsyncedChanges().then(setHasUnsynced);
    });

    const unsubscribeLogs = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });

    const interval = setInterval(() => {
      syncService.hasUnsyncedChanges().then(setHasUnsynced);
    }, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      unsubscribeLogs();
      clearInterval(interval);
    };
  }, []);

  /**
   * Handles the logout button click.
   * If there are unsynced changes, a warning dialog is shown.
   */
  const handleLogoutClick = async () => {
    const hasUnsynced = await syncService.hasUnsyncedChanges();
    if (hasUnsynced) {
      setLogoutDialogOpen(true);
    } else {
      logout();
    }
  };

  /**
   * Confirms and executes the logout action from the dialog.
   */
  const confirmLogout = async () => {
    setLogoutDialogOpen(false);
    try {
      // 1. Clear local database
      await db.delete();

      // 2. Clear ETags from localStorage to ensure a fresh sync upon re-login
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("etag_")) {
          keysToRemove.push(key);
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (err) {
      logger.error("Failed to clean up local state during logout:", err);
    }
    logout();
  };

  /**
   * Copies the current logs to the clipboard.
   */
  const copyLogsToClipboard = () => {
    const logString = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${
            l.error ? `\nError: ${JSON.stringify(l.error)}` : ""
          }${l.context ? `\nContext: ${JSON.stringify(l.context)}` : ""}`,
      )
      .join("\n\n");
    navigator.clipboard.writeText(logString);
    setSnackbar({
      open: true,
      message: "Logs copied to clipboard",
      severity: "success",
    });
  };

  /**
   * Clears all stored logs.
   */
  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    setClearLogsDialogOpen(false);
    setSnackbar({
      open: true,
      message: "Logs cleared",
      severity: "success",
    });
  };

  const logoutDialog = (
    <Dialog
      open={logoutDialogOpen}
      onClose={() => setLogoutDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle
        sx={{
          fontFamily: "var(--serif)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "error.main",
        }}
      >
        <WarningIcon color="error" />
        Unsynced Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have data that hasn't been synced to the server yet. If you logout
          now, these changes may be lost. Are you sure you want to logout?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, px: 3, pb: 3 }}>
        <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
          Cancel
        </Button>
        <Button onClick={confirmLogout} color="error" variant="contained">
          Logout Anyway
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ pb: 8 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
      <EntityBanner
        title="Settings"
        icon={<SettingsIcon />}
        subtitle="Manage your application and view system status"
        backTo="/"
      />

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "100%",
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: "primary.main",
              mx: "auto",
              mb: 3,
              fontSize: "3rem",
            }}
          >
            <SettingsIcon fontSize="inherit" />
          </Avatar>

          <Typography variant="h4" sx={{ mb: 1, fontFamily: "var(--serif)" }}>
            Application Settings
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            System Configuration
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Typography
            variant="subtitle1"
            gutterBottom
            align="left"
            sx={{ fontWeight: 600 }}
          >
            System Status
          </Typography>

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Network Connection</Typography>
              <Chip
                icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
                label={isOnline ? "Online" : "Offline"}
                color={isOnline ? "success" : "error"}
                size="small"
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Synchronization Status</Typography>
              <Chip
                icon={
                  isSyncing ? (
                    <SyncingIcon className="spin" />
                  ) : hasUnsynced ? (
                    <WarningIcon />
                  ) : (
                    <SyncingIcon />
                  )
                }
                label={
                  isSyncing
                    ? "Syncing..."
                    : hasUnsynced
                      ? "Unsynced changes"
                      : "Up to date"
                }
                color={
                  isSyncing ? "secondary" : hasUnsynced ? "warning" : "default"
                }
                size="small"
              />
            </Box>
          </Stack>

          <Button
            variant="contained"
            color="error"
            fullWidth
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogoutClick}
            sx={{ borderRadius: 2, mb: 4 }}
          >
            Logout
          </Button>

          <Divider sx={{ mb: 4 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              System Logs
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<CopyIcon />}
                onClick={copyLogsToClipboard}
                disabled={logs.length === 0}
              >
                Copy
              </Button>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={() => setClearLogsDialogOpen(true)}
                disabled={logs.length === 0}
                color="error"
              >
                Clear
              </Button>
            </Stack>
          </Box>

          <Paper
            elevation={0}
            sx={{
              bgcolor: "background.default",
              borderRadius: 2,
              p: 2,
              maxHeight: 300,
              overflowY: "auto",
              textAlign: "left",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            {logs.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", fontStyle: "italic", py: 2 }}
              >
                No logs recorded yet.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {[...logs].reverse().map((log, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          color:
                            log.level === "error"
                              ? "error.main"
                              : log.level === "warn"
                                ? "warning.main"
                                : "text.secondary",
                          textTransform: "uppercase",
                        }}
                      >
                        {log.level}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        wordBreak: "break-all",
                      }}
                    >
                      {log.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Paper>
      </Box>
      {logoutDialog}
      <Dialog
        open={clearLogsDialogOpen}
        onClose={() => setClearLogsDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "var(--serif)" }}>
          Clear System Logs?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear all system logs? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, pb: 3 }}>
          <Button onClick={() => setClearLogsDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleClearLogs} color="error" variant="contained">
            Clear Logs
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
