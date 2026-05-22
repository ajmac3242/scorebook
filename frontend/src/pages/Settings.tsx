import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  DeleteOutlined as ClearIcon,
  Logout as LogoutIcon,
  Refresh as SyncIcon,
  Warning as WarningIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { UserPool } from "../UserPool";
import { db } from "../db";
import { useAppTheme } from "../theme/ThemeContext";
import { logger, type LogEntry } from "../utils/logger";
import { syncService } from "../utils/syncService";
import AppPageShell, {
  type AppPageTab,
} from "../components/layout/AppPageShell";
import PageSectionCard from "../components/layout/PageSectionCard";
import PageSectionIntro from "../components/layout/PageSectionIntro";
import SettingsRow from "../components/settings/SettingsRow";
import ThemePresetCard from "../components/settings/ThemePresetCard";

type SettingsTab = "account" | "system" | "appearance";

const TABS: readonly AppPageTab<SettingsTab>[] = [
  { value: "account", label: "Account" },
  { value: "system", label: "System" },
  { value: "appearance", label: "Appearance" },
] as const;

const Settings: React.FC = () => {
  const theme = useTheme();
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userEmail, setUserEmail] = useState("—");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const cognitoUser = UserPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: unknown) => {
        if (!err && session) {
          cognitoUser.getUserAttributes((attrErr, attrs) => {
            if (!attrErr && attrs) {
              const emailAttr = attrs.find((a) => a.getName() === "email");
              if (emailAttr) setUserEmail(emailAttr.getValue());
            }
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "system") return;

    setLogs(logger.getLogs());

    const loadStats = async () => {
      const stats: Record<string, number> = {};
      for (const table of db.tables) {
        stats[table.name] = await table.count();
      }
      setDbStats(stats);
    };

    void loadStats();
  }, [activeTab]);

  const totalDbRecords = useMemo(
    () => Object.values(dbStats).reduce((a, b) => a + b, 0),
    [dbStats],
  );

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.pushUpdates();
      showSnackbar("Sync complete.");
    } catch {
      showSnackbar("Sync failed. Please try again.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    showSnackbar("Logs cleared.");
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.level.toUpperCase()}] ${l.timestamp} — ${l.message}`)
      .join("\n");

    void navigator.clipboard.writeText(text).then(() => {
      showSnackbar("Logs copied.");
    });
  };

  const renderAccountTab = () => (
    <PageSectionCard>
      <Box sx={{ p: { xs: 2.5, md: 0 } }}>
        <PageSectionIntro
          title="Account"
          description="Manage your local app data and sign out safely."
        />

        <SettingsRow
          label="Email address"
          description="Your registered account email."
          control={
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>
          }
        />

        <SettingsRow
          label="Logout"
          description="Sign out of CourtSight on this device. Local cache and stored sync metadata will be cleared."
          noDivider
          control={
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{ minHeight: 34 }}
            >
              Log out
            </Button>
          }
        />
      </Box>
    </PageSectionCard>
  );

  const renderAppearanceTab = () => (
    <PageSectionCard>
      <Box sx={{ p: { xs: 2.5, md: 0 } }}>
        <PageSectionIntro
          title="Appearance"
          description="Change how your application looks and feels."
        />

        <SettingsRow
          label="Theme presets"
          description="Choose how the app should appear across the interface."
          noDivider
          control={
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
                width: "100%",
                maxWidth: 980,
              }}
            >
              {availablePresets.map((preset) => (
                <ThemePresetCard
                  key={preset.id}
                  preset={preset}
                  selected={presetId === preset.id}
                  onSelect={() => setPresetId(preset.id)}
                />
              ))}
            </Box>
          }
        />
      </Box>
    </PageSectionCard>
  );

  const renderSystemTab = () => (
    <PageSectionCard>
      <Box sx={{ p: { xs: 2.5, md: 0 } }}>
        <PageSectionIntro
          title="System"
          description="Monitor sync health, inspect local storage, and review logs."
        />

        <SettingsRow
          label="Sync"
          description="Manually push local changes to the cloud."
          control={
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Chip
                icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
                label={isOnline ? "Online" : "Offline"}
                color={isOnline ? "success" : "default"}
                size="small"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<SyncIcon />}
                disabled={isSyncing || !isOnline}
                onClick={handleSync}
                sx={{ minHeight: 34 }}
              >
                {isSyncing ? "Syncing…" : "Sync now"}
              </Button>
            </Stack>
          }
        />

        <SettingsRow
          label="Local storage"
          description={`${totalDbRecords.toLocaleString()} total records across ${Object.keys(dbStats).length} tables.`}
          control={
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {Object.entries(dbStats).map(([table, count]) => (
                <Chip
                  key={table}
                  label={`${table}: ${count.toLocaleString()}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          }
        />

        <SettingsRow
          label="Logs"
          description="Diagnostic log output from this session."
          noDivider
          control={
            <Stack spacing={1.25} sx={{ width: "100%" }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CopyIcon />}
                  disabled={logs.length === 0}
                  onClick={handleCopyLogs}
                  sx={{ minHeight: 34 }}
                >
                  Copy
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<ClearIcon />}
                  disabled={logs.length === 0}
                  onClick={handleClearLogs}
                  sx={{ minHeight: 34 }}
                >
                  Clear
                </Button>
              </Stack>

              <Box
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1.25,
                }}
              >
                {logs.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No logs yet.
                  </Typography>
                ) : (
                  <Stack spacing={0.25}>
                    {logs.map((log, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        component="div"
                        sx={{
                          fontFamily: "monospace",
                          color:
                            log.level === "error"
                              ? "error.main"
                              : log.level === "warn"
                                ? "warning.main"
                                : "text.secondary",
                        }}
                      >
                        [{log.level.toUpperCase()}] {log.timestamp} {log.message}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          }
        />
      </Box>
    </PageSectionCard>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return renderAccountTab();
      case "appearance":
        return renderAppearanceTab();
      case "system":
        return renderSystemTab();
      default:
        return renderAccountTab();
    }
  };

  return (
    <>
      <AppPageShell<SettingsTab>
        title="Settings"
        activeTab={activeTab}
        tabs={TABS}
        onTabChange={(tab) => setActiveTab(tab)}
      >
        {renderContent()}
      </AppPageShell>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          icon={snackbar.severity === "warning" ? <WarningIcon /> : undefined}
          sx={{ fontSize: theme.typography.body2.fontSize }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Settings;