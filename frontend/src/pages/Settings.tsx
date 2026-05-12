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
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Tooltip,
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
  Check as CheckIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger, type LogEntry } from "../utils/logger";
import EntityBanner from "../components/EntityBanner";
import { db } from "../db";
import { useAppTheme, ThemePreset } from "../theme/ThemeContext";

interface PresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  selected,
  onSelect,
}) => (
  <Card
    variant="outlined"
    sx={{
      borderColor: selected ? "primary.main" : "divider",
      borderWidth: selected ? 2 : 1,
      borderRadius: 2,
      transition: "border-color 0.2s",
    }}
  >
    <CardActionArea onClick={onSelect} sx={{ p: 0 }}>
      <Box
        sx={{
          height: 56,
          bgcolor: preset.previewColor,
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <CheckIcon
            sx={{
              color: "common.white",
              bgcolor: "rgba(0,0,0,0.35)",
              borderRadius: "50%",
              p: 0.4,
              fontSize: 28,
            }}
          />
        )}
      </Box>
      <CardContent sx={{ py: 1, px: 1.5 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {preset.label}
        </Typography>
        <Chip
          label={preset.mode}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.6rem", height: 18, mt: 0.5 }}
        />
      </CardContent>
    </CardActionArea>
  </Card>
);

/**
 * Settings page component.
 * Displays system status, appearance options, and account management.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());
  const [isCopied, setIsCopied] = useState(false);
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

    syncService.hasUnsyncedChanges().then(setHasUnsynced);

    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
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

  const handleLogoutClick = async () => {
    const unsynced = await syncService.hasUnsyncedChanges();
    if (unsynced) {
      setLogoutDialogOpen(true);
    } else {
      logout();
    }
  };

  const confirmLogout = async () => {
    setLogoutDialogOpen(false);
    try {
      await db.delete();

      const keysToRemove: string[] = [];
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
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setSnackbar({
      open: true,
      message: "Logs copied to clipboard",
      severity: "success",
    });
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all system logs?")) {
      logger.clearLogs();
      setLogs([]);
      setSnackbar({
        open: true,
        message: "System logs cleared",
        severity: "success",
      });
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
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
            maxWidth: 800,
            width: "100%",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
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

          <Typography variant="h4" align="center" sx={{ mb: 1 }}>
            Application Settings
          </Typography>
          <Typography color="text.secondary" align="center" sx={{ mb: 4 }}>
            System Configuration
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <PaletteIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                Appearance
              </Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              THEME
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose a colour theme for CourtSight. Your selection is saved
              automatically.
            </Typography>

            <Grid container spacing={2}>
              {availablePresets.map((preset) => (
                <Grid item xs={6} sm={4} md={3} key={preset.id}>
                  <Tooltip title={preset.label} arrow>
                    <span>
                      <PresetCard
                        preset={preset}
                        selected={preset.id === presetId}
                        onSelect={() => setPresetId(preset.id)}
                      />
                    </span>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
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
                startIcon={isCopied ? <CheckIcon /> : <CopyIcon />}
                onClick={copyLogsToClipboard}
                disabled={logs.length === 0}
                color={isCopied ? "success" : "primary"}
              >
                {isCopied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearLogs}
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
              border: "1px solid",
              borderColor: "divider",
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

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
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
            You have data that hasn't been synced to the server yet. If you
            logout now, these changes may be lost. Are you sure you want to
            logout?
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
    </Box>
  );
};

export default Settings;
