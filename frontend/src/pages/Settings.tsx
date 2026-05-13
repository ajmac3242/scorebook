import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as ClearIcon,
  Logout as LogoutIcon,
  Refresh as SyncingIcon,
  Warning as WarningIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
} from "@mui/icons-material";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import { db } from "../db";
import { useAppTheme, ThemePreset } from "../theme/ThemeContext";
import { logger, type LogEntry } from "../utils/logger";
import { syncService } from "../utils/syncService";

type SettingsTab = "account" | "system" | "appearance";

interface PresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

interface SettingsRowProps {
  label: string;
  description?: string;
  action: React.ReactNode;
  borderBottom?: boolean;
  alignTop?: boolean;
}

const tabValueToIndex = (tab: SettingsTab): number => {
  if (tab === "account") return 0;
  if (tab === "system") return 1;
  return 2;
};

const indexToTabValue = (index: number): SettingsTab => {
  if (index === 0) return "account";
  if (index === 1) return "system";
  return "appearance";
};

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  selected,
  onSelect,
}) => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: "10px",
      borderColor: selected ? "primary.main" : "#E4E7EC",
      borderWidth: selected ? 1.5 : 1,
      overflow: "hidden",
      bgcolor: "#FFFFFF",
      boxShadow: "none",
      transition: "all 0.18s ease",
      "&:hover": {
        borderColor: selected ? "primary.main" : "#D0D5DD",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
      },
    }}
  >
    <CardActionArea onClick={onSelect} sx={{ height: "100%" }}>
      <Box
        sx={{
          p: 1.25,
          bgcolor: "#F9FAFB",
          borderBottom: "1px solid #EAECF0",
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: 104,
            borderRadius: "8px",
            border: "1px solid",
            borderColor: selected ? "primary.main" : "#EAECF0",
            bgcolor: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 10,
              bgcolor: preset.previewColor,
              borderBottom: "1px solid #EAECF0",
            }}
          />

          <Box sx={{ display: "flex", height: "calc(100% - 10px)" }}>
            <Box
              sx={{
                width: "30%",
                borderRight: "1px solid #EAECF0",
                bgcolor: "#F9FAFB",
                p: 0.75,
              }}
            >
              <Box
                sx={{
                  width: "72%",
                  height: 5,
                  borderRadius: 999,
                  bgcolor: "#D0D5DD",
                  mb: 0.75,
                }}
              />
              <Box
                sx={{
                  width: "88%",
                  height: 4,
                  borderRadius: 999,
                  bgcolor: "#EAECF0",
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  width: "68%",
                  height: 4,
                  borderRadius: 999,
                  bgcolor: "#EAECF0",
                }}
              />
            </Box>

            <Box sx={{ flex: 1, p: 1 }}>
              <Box
                sx={{
                  width: "40%",
                  height: 5,
                  borderRadius: 999,
                  bgcolor: "#D0D5DD",
                  mb: 1,
                }}
              />
              <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    height: 32,
                    borderRadius: "6px",
                    border: "1px solid #EAECF0",
                    bgcolor: "#FCFCFD",
                  }}
                />
                <Box
                  sx={{
                    flex: 1,
                    height: 32,
                    borderRadius: "6px",
                    border: "1px solid #EAECF0",
                    bgcolor: "#FCFCFD",
                  }}
                />
              </Stack>
              <Box
                sx={{
                  width: "90%",
                  height: 4,
                  borderRadius: 999,
                  bgcolor: "#EAECF0",
                  mb: 0.5,
                }}
              />
              <Box
                sx={{
                  width: "70%",
                  height: 4,
                  borderRadius: 999,
                  bgcolor: "#EAECF0",
                }}
              />
            </Box>
          </Box>

          {selected && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 2px rgba(16,24,40,0.16)",
              }}
            >
              <CheckIcon sx={{ fontSize: 12 }} />
            </Box>
          )}
        </Box>
      </Box>

      <CardContent
        sx={{
          px: 1.5,
          py: 1.25,
          "&:last-child": { pb: 1.25 },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "#101828",
            mb: 0.25,
          }}
        >
          {preset.label}
        </Typography>
        <Typography variant="caption" sx={{ color: "#667085" }}>
          {preset.mode}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  action,
  borderBottom = true,
  alignTop = false,
}) => (
  <Box
    sx={{
      py: 2.5,
      borderBottom: borderBottom ? "1px solid #EAECF0" : "none",
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" },
      gap: { xs: 1.5, md: 3 },
      alignItems: alignTop ? "start" : "center",
    }}
  >
    <Box>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#344054",
          mb: description ? 0.5 : 0,
        }}
      >
        {label}
      </Typography>
      {description && (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "#667085",
            lineHeight: 1.45,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
    <Box>{action}</Box>
  </Box>
);

const SectionIntro: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <Box sx={{ mb: 0.5, pt: 0.5 }}>
    <Typography
      sx={{
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "#101828",
        mb: 0.5,
      }}
    >
      {title}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.875rem",
        color: "#667085",
        lineHeight: 1.5,
      }}
    >
      {subtitle}
    </Typography>
  </Box>
);

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
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

  const syncStatusChip = useMemo(() => {
    if (isSyncing) {
      return (
        <Chip
          icon={<SyncingIcon className="spin" />}
          label="Syncing…"
          color="secondary"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    }

    if (hasUnsynced) {
      return (
        <Chip
          icon={<WarningIcon />}
          label="Unsynced changes"
          color="warning"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    }

    return (
      <Chip
        icon={<CheckIcon />}
        label="Up to date"
        color="success"
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  }, [hasUnsynced, isSyncing]);

  const networkChip = isOnline ? (
    <Chip
      icon={<OnlineIcon />}
      label="Online"
      color="success"
      size="small"
      sx={{ fontWeight: 500 }}
    />
  ) : (
    <Chip
      icon={<OfflineIcon />}
      label="Offline"
      color="error"
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );

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
    <Box
      sx={{
        pb: 4,
        pt: 0.5,
        bgcolor: "#F9FAFB",
        minHeight: "100%",
      }}
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

      <PageContainer width="full">
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: "1px solid #EAECF0",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              pt: 2,
              pb: 0.75,
            }}
          >
            <Typography
              sx={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#101828",
                mb: 0.25,
              }}
            >
              Settings
            </Typography>
          </Box>

          <Box
            sx={{
              px: { xs: 1, sm: 2 },
              borderBottom: "1px solid #EAECF0",
            }}
          >
            <Tabs
              value={tabValueToIndex(activeTab)}
              onChange={(_, value) => setActiveTab(indexToTabValue(value))}
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{
                style: {
                  height: 2,
                  borderRadius: 999,
                },
              }}
              sx={{
                minHeight: 44,
                "& .MuiTabs-indicator": {
                  backgroundColor: "#101828",
                },
                "& .MuiTab-root": {
                  minHeight: 44,
                  minWidth: "auto",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  color: "#667085",
                  px: 1.5,
                },
                "& .Mui-selected": {
                  color: "#101828 !important",
                },
              }}
            >
              <Tab label="Account" />
              <Tab label="System" />
              <Tab label="Appearance" />
            </Tabs>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3 }, py: 0.5 }}>
            {activeTab === "account" && (
              <Box sx={{ py: 1.5 }}>
                <SectionIntro
                  title="Account"
                  subtitle="Manage your local app data and sign out safely."
                />

                <SettingsRow
                  label="Logout"
                  description="Sign out of CourtSight on this device. Unsynced changes may be lost if they have not finished uploading."
                  borderBottom={false}
                  action={
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      {hasUnsynced ? (
                        <Chip
                          icon={<WarningIcon />}
                          label="Unsynced changes"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : (
                        <Chip
                          icon={<CheckIcon />}
                          label="Safe to logout"
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogoutClick}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "none",
                        }}
                      >
                        Log out
                      </Button>
                    </Stack>
                  }
                />
              </Box>
            )}

            {activeTab === "system" && (
              <Box sx={{ py: 1.5 }}>
                <SectionIntro
                  title="System"
                  subtitle="Check connectivity, synchronization, and local diagnostic logs."
                />

                <SettingsRow
                  label="Network connection"
                  description="Current internet connectivity for this device."
                  action={networkChip}
                />

                <SettingsRow
                  label="Synchronization"
                  description="Shows whether local data has finished syncing to the server."
                  action={syncStatusChip}
                />

                <SettingsRow
                  label="System logs"
                  description="Copy logs for debugging or clear them from local storage."
                  alignTop
                  borderBottom={false}
                  action={
                    <Box>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{ mb: 1.5 }}
                      >
                        <Button
                          size="small"
                          startIcon={isCopied ? <CheckIcon /> : <CopyIcon />}
                          onClick={copyLogsToClipboard}
                          disabled={logs.length === 0}
                          color={isCopied ? "success" : "inherit"}
                          sx={{
                            textTransform: "none",
                            alignSelf: "flex-start",
                            color: isCopied ? undefined : "#344054",
                            borderColor: "#D0D5DD",
                          }}
                          variant="outlined"
                        >
                          {isCopied ? "Copied" : "Copy logs"}
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ClearIcon />}
                          onClick={handleClearLogs}
                          disabled={logs.length === 0}
                          color="error"
                          sx={{
                            textTransform: "none",
                            alignSelf: "flex-start",
                          }}
                        >
                          Clear logs
                        </Button>
                      </Stack>

                      <Paper
                        elevation={0}
                        sx={{
                          bgcolor: "#F9FAFB",
                          borderRadius: "8px",
                          p: 2,
                          maxHeight: 260,
                          overflowY: "auto",
                          border: "1px solid #EAECF0",
                        }}
                      >
                        {logs.length === 0 ? (
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              color: "#667085",
                              fontStyle: "italic",
                            }}
                          >
                            No logs recorded yet.
                          </Typography>
                        ) : (
                          <Stack spacing={1.25}>
                            {[...logs].reverse().map((log, index) => (
                              <Box key={index}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 1,
                                    mb: 0.25,
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: "0.6875rem",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      color:
                                        log.level === "error"
                                          ? "error.main"
                                          : log.level === "warn"
                                            ? "warning.main"
                                            : "#667085",
                                    }}
                                  >
                                    {log.level}
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontSize: "0.6875rem",
                                      color: "#667085",
                                    }}
                                  >
                                    {new Date(
                                      log.timestamp,
                                    ).toLocaleTimeString()}
                                  </Typography>
                                </Box>
                                <Typography
                                  sx={{
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    color: "#101828",
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
                    </Box>
                  }
                />
              </Box>
            )}

            {activeTab === "appearance" && (
              <Box sx={{ py: 1.5 }}>
                <SectionIntro
                  title="Appearance"
                  subtitle="Change how your application looks and feels."
                />

                <SettingsRow
                  label="Color theme"
                  description="Select a theme for the application interface."
                  action={
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1,
                        border: "1px solid #D0D5DD",
                        borderRadius: "8px",
                        minWidth: 150,
                        bgcolor: "#FFFFFF",
                      }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          bgcolor:
                            availablePresets.find(
                              (preset) => preset.id === presetId,
                            )?.previewColor || "primary.main",
                          border: "1px solid rgba(16,24,40,0.08)",
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: "#101828",
                          fontWeight: 500,
                        }}
                      >
                        {availablePresets.find(
                          (preset) => preset.id === presetId,
                        )?.label ?? "Theme"}
                      </Typography>
                    </Box>
                  }
                />

                <SettingsRow
                  label="Theme presets"
                  description="Choose how the app should appear across the interface."
                  alignTop
                  borderBottom={false}
                  action={
                    <Box>
                      <Grid container spacing={2}>
                        {availablePresets.map((preset) => (
                          <Grid item xs={12} sm={6} lg={4} key={preset.id}>
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
                  }
                />
              </Box>
            )}
          </Box>
        </Paper>
      </PageContainer>

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
            You have data that hasn't been synced to the server yet. If you log
            out now, these changes may be lost. Are you sure you want to
            continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3, pb: 3 }}>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmLogout} color="error" variant="contained">
            Log out anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
