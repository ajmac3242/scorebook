import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
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
import { PageSnackbar, EmptyState } from "../components/feedback";
import { ConfirmDialog } from "../components/dialogs";
import { usePageSnackbar } from "../hooks/usePageSnackbar";
import { useTokens } from "../theme/useTokens";

type SettingsTab = "account" | "system" | "appearance";

const TABS: readonly AppPageTab<SettingsTab>[] = [
  { value: "account", label: "Account" },
  { value: "system", label: "System" },
  { value: "appearance", label: "Appearance" },
] as const;

const APP_VERSION = `${import.meta.env.VITE_BUILD_DATE ?? "—"}.${import.meta.env.VITE_BUILD_NUMBER ?? "local"}`;

const Settings: React.FC = () => {
  const tokens = useTokens();
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
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingLocalData, setIsDeletingLocalData] = useState(false);
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
    setIsDeletingLocalData(true);
    try {
      await db.transaction("rw", db.tables, async () => {
        for (const table of db.tables) {
          await table.clear();
        }
      });

      await loadDbStats();
      showSnackbar("Local data deleted.", "success");
    } catch (err) {
      logger.error("Failed to delete local data:", err);
      showSnackbar("Failed to delete local data. Please try again.", "error");
    } finally {
      setIsDeletingLocalData(false);
    }
  };

  const renderAccountTab = () => (
    <PageSectionCard>
      <Box sx={{ p: { xs: tokens.semantic.spacing.md / 8, md: 0 } }}>
        <PageSectionIntro
          title="Account"
          description="Manage your local app data and sign out safely."
        />

        {hasName ? (
          <SettingsRow
            label="Name"
            description="Your registered account name."
            control={
              <Typography
                variant="body2"
                sx={{ color: tokens.semantic.color.text.secondary }}
              >
                {displayName}
              </Typography>
            }
          />
        ) : null}

        <SettingsRow
          label="Email address"
          description="Your registered account email."
          control={
            <Typography
              variant="body2"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
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
              onClick={() => setIsLogoutConfirmOpen(true)}
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
      <Box sx={{ p: { xs: tokens.semantic.spacing.md / 8, md: 0 } }}>
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
                gap: tokens.semantic.spacing.sm / 8,
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
      <Box sx={{ p: { xs: tokens.semantic.spacing.md / 8, md: 0 } }}>
        <PageSectionIntro
          title="System"
          description="Check connectivity, synchronization, and local diagnostic logs."
        />

        <SettingsRow
          label="App version"
          description="Build identifier in YYYY-MM-DD.build format."
          control={
            <Typography
              variant="body2"
              sx={{
                color: tokens.semantic.color.text.secondary,
                fontFamily: tokens.typography.fontFamily.mono,
                fontWeight: tokens.typography.fontWeight.semibold,
              }}
            >
              {APP_VERSION}
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
                fontWeight: tokens.typography.fontWeight.semibold,
                ...(isOnline && {
                  bgcolor: tokens.semantic.color.feedback.success.main,
                  color: tokens.semantic.color.feedback.success.contrastText,
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
              spacing={tokens.semantic.spacing.xs / 8}
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
                  fontWeight: tokens.typography.fontWeight.semibold,
                  ...(isOnline && {
                    bgcolor: tokens.semantic.color.feedback.success.main,
                    color: tokens.semantic.color.feedback.success.contrastText,
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
                gap: tokens.semantic.spacing.sm / 8,
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
                  columnGap: tokens.semantic.spacing.md / 8,
                  rowGap: tokens.semantic.spacing.xs / 8,
                }}
              >
                {Object.entries(dbStats).map(([table, count]) => (
                  <Typography
                    key={table}
                    variant="body2"
                    sx={{ color: tokens.semantic.color.text.secondary }}
                  >
                    <Box
                      component="span"
                      sx={{
                        color: tokens.semantic.color.text.primary,
                        fontWeight: tokens.typography.fontWeight.semibold,
                      }}
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
                onClick={() => setIsDeleteConfirmOpen(true)}
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
            <Stack
              spacing={tokens.semantic.spacing.sm / 8}
              sx={{ width: "100%" }}
            >
              <Stack
                direction="row"
                spacing={tokens.semantic.spacing.xs / 8}
                sx={{ flexWrap: "wrap" }}
              >
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
                role="region"
                aria-label="Diagnostic logs list"
                tabIndex={0}
                sx={{
                  maxHeight: 220,
                  overflowY: "auto",
                  bgcolor: tokens.semantic.color.background.subtle,
                  borderRadius: tokens.semantic.shape.radius.md / 8,
                  border: "1px solid",
                  borderColor: tokens.semantic.color.border.subtle,
                  p: tokens.semantic.spacing.sm / 8,
                }}
              >
                {logs.length === 0 ? (
                  <EmptyState
                    icon={<CopyIcon sx={{ fontSize: 24 }} />}
                    title="No logs yet"
                    description="Diagnostic logs will appear here when application events occur."
                  />
                ) : (
                  <Stack spacing={tokens.semantic.spacing.xs / 8}>
                    {logs.map((log, i) => (
                      <Box key={i}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            fontWeight: tokens.typography.fontWeight.bold,
                            letterSpacing: 0.2,
                            color:
                              log.level === "error"
                                ? tokens.semantic.color.feedback.error.main
                                : log.level === "warn"
                                  ? tokens.semantic.color.feedback.warning.main
                                  : tokens.semantic.color.text.secondary,
                          }}
                        >
                          {log.level.toUpperCase()}
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              fontWeight: tokens.typography.fontWeight.semibold,
                              color: tokens.semantic.color.text.disabled,
                            }}
                          >
                            {log.timestamp}
                          </Box>
                        </Typography>
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{
                            fontFamily: tokens.typography.fontFamily.mono,
                            color: tokens.semantic.color.text.primary,
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

      <ConfirmDialog
        open={isLogoutConfirmOpen}
        title="Confirm Logout"
        description="Are you sure you want to log out? Any unsynced local data will remain on this device, but you will need to log in again to access it."
        confirmLabel="Log out"
        onConfirm={logout}
        onClose={() => setIsLogoutConfirmOpen(false)}
        destructive
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete All Local Data?"
        description="This will permanently delete all teams, players, and game data stored on this device. This action cannot be undone unless your data has been synced to the server."
        confirmLabel="Delete Everything"
        onConfirm={async () => {
          await handleClearLocalStorage();
          setIsDeleteConfirmOpen(false);
        }}
        onClose={() => setIsDeleteConfirmOpen(false)}
        destructive
        loading={isDeletingLocalData}
      />

      <PageSnackbar {...snackbar} onClose={hideSnackbar} />
    </>
  );
};

export default Settings;
