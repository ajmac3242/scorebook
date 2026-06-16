import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  DeleteOutlined as DeleteIcon,
  Logout as LogoutIcon,
  Refresh as SyncIcon,
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
import { PageSnackbar } from "../components/feedback";
import { usePageSnackbar } from "../hooks/usePageSnackbar";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();

  const loadDbStats = useCallback(async () => {
    const stats: Record<string, number> = {};
    for (const table of db.tables) {
      stats[table.name] = await table.count();
    }
    setDbStats(stats);
  }, []);

  useEffect(() => {
    const cognitoUser = UserPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: unknown) => {
        if (!err && session) {
          cognitoUser.getUserAttributes((attrErr, attrs) => {
            if (!attrErr && attrs) {
              const emailAttr = attrs.find((a) => a.getName() === "email");
              const givenNameAttr = attrs.find(
                (a) => a.getName() === "given_name",
              );
              const familyNameAttr = attrs.find(
                (a) => a.getName() === "family_name",
              );

              if (emailAttr) setUserEmail(emailAttr.getValue());
              if (givenNameAttr) setFirstName(givenNameAttr.getValue());
              if (familyNameAttr) setLastName(familyNameAttr.getValue());
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
    void loadDbStats();
  }, [activeTab, loadDbStats]);

  const totalDbRecords = useMemo(
    () => Object.values(dbStats).reduce((a, b) => a + b, 0),
    [dbStats],
  );

  const displayName = useMemo(() => {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "—";
  }, [firstName, lastName]);

  const hasName = Boolean(firstName || lastName);

  const syncStatusLabel = useMemo(() => {
    if (isSyncing) return "Syncing…";
    if (isOnline) return "Up to date";
    return "Offline";
  }, [isOnline, isSyncing]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncService.pushUpdates();
      setLogs(logger.getLogs());
      await loadDbStats();
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

  const handleClearLocalStorage = async () => {
    try {
      await db.transaction("rw", db.tables, async () => {
        for (const table of db.tables) {
          await table.clear();
        }
      });

      await loadDbStats();
      showSnackbar("Local data deleted.");
    } catch {
      showSnackbar("Failed to delete local data.", "error");
    }
  };

  const renderAccountTab = () => (
    <PageSectionCard>
      <Box sx={{ p: { xs: 2.5, md: 0 } }}>
        <PageSectionIntro
          title="Account"
          description="Manage your local app data and sign out safely."
        />

        {hasName ? (
          <SettingsRow
            label="Name"
            description="Your registered account name."
            control={
              <Typography variant="body2" color="text.secondary">
                {displayName}
              </Typography>
            }
          />
        ) : null}

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
          description="Check connectivity, synchronization, and local diagnostic logs."
        />

        <SettingsRow
          label="Version"
          description="Deployed build — format YYYYMMDD.build"
          control={
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              {__APP_VERSION__}
            </Typography>
          }
        />

        <SettingsRow
          label="Network connection"
          description="Current internet connectivity for this device."
          control={
            <Chip
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "default"}
              size="small"
              sx={{
                fontWeight: 600,
                ...(isOnline && {
                  bgcolor: "success.main",
                  color: "success.contrastText",
                  "& .MuiChip-icon": {
                    color: "inherit",
                  },
                }),
              }}
            />
          }
        />

        <SettingsRow
          label="Synchronization"
          description="Shows whether local data has finished syncing to the server."
          control={
            <Stack
              direction="row"
              spacing={1.25}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Chip
                icon={
                  isOnline ? (
                    isSyncing ? (
                      <SyncIcon />
                    ) : (
                      <CheckCircleIcon />
                    )
                  ) : (
                    <OfflineIcon />
                  )
                }
                label={syncStatusLabel}
                color={isOnline ? "success" : "default"}
                size="small"
                sx={{
                  fontWeight: 600,
                  ...(isOnline && {
                    bgcolor: "success.main",
                    color: "success.contrastText",
                    "& .MuiChip-icon": {
                      color: "inherit",
                    },
                  }),
                }}
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
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "flex-start", md: "flex-start" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, max-content))",
                    lg: "repeat(3, minmax(0, max-content))",
                  },
                  columnGap: 3,
                  rowGap: 0.75,
                }}
              >
                {Object.entries(dbStats).map(([table, count]) => (
                  <Typography
                    key={table}
                    variant="body2"
                    color="text.secondary"
                  >
                    <Box
                      component="span"
                      sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                      {table}
                    </Box>
                    {`: ${count.toLocaleString()}`}
                  </Typography>
                ))}
              </Box>

              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleClearLocalStorage}
                sx={{ minHeight: 34, flexShrink: 0 }}
              >
                Delete local data
              </Button>
            </Box>
          }
        />

        <SettingsRow
          label="System logs"
          description="Copy logs for debugging or clear them from local storage."
          noDivider
          control={
            <Stack spacing={1.5} sx={{ width: "100%" }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CopyIcon />}
                  disabled={logs.length === 0}
                  onClick={handleCopyLogs}
                  sx={{ minHeight: 34 }}
                >
                  Copy logs
                </Button>
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  disabled={logs.length === 0}
                  onClick={handleClearLogs}
                  sx={{ minHeight: 34 }}
                >
                  Clear logs
                </Button>
              </Stack>

              <Box
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  bgcolor:
                    theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1.5,
                }}
              >
                {logs.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No logs yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {logs.map((log, i) => (
                      <Box key={i}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: 700,
                            letterSpacing: 0.2,
                            color:
                              log.level === "error"
                                ? "error.main"
                                : log.level === "warn"
                                  ? "warning.main"
                                  : "text.secondary",
                          }}
                        >
                          {log.level.toUpperCase()}
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              fontWeight: 600,
                              color: "text.disabled",
                            }}
                          >
                            {log.timestamp}
                          </Box>
                        </Typography>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{
                            fontFamily: "monospace",
                            color: "text.primary",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {log.message}
                        </Typography>
                      </Box>
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
      <PageSnackbar {...snackbar} onClose={hideSnackbar} />
    </>
  );
};

export default Settings;
