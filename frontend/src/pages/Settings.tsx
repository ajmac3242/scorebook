import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
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
import { useAuth } from "../context/AuthContext";
import { db } from "../db";
import { useAppTheme, ThemePreset } from "../theme/ThemeContext";
import { logger, type LogEntry } from "../utils/logger";
import { syncService } from "../utils/syncService";
import { UserPool } from "../UserPool";

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
}) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        border: selected
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius * 1.5}px`,
        transition: `border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}, box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
        boxShadow: selected
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`
          : "none",
        "&:hover": {
          boxShadow: selected
            ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`
            : theme.shadows[2],
        },
      }}
    >
      <CardActionArea
        onClick={onSelect}
        sx={{
          minHeight: 44, // touch target minimum
          borderRadius: "inherit",
        }}
      >
        <CardContent
          sx={{ p: theme.spacing(2), "&:last-child": { pb: theme.spacing(2) } }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: preset.previewColor,
                flexShrink: 0,
                border: `1px solid ${alpha(preset.previewColor, 0.3)}`,
              }}
            />
            <Typography
              variant="body2"
              fontWeight={selected ? 600 : 400}
              color={selected ? "primary.main" : "text.primary"}
              sx={{ fontSize: theme.typography.body2.fontSize }}
            >
              {preset.label}
            </Typography>
            {selected && (
              <CheckIcon
                sx={{
                  ml: "auto",
                  fontSize: 18,
                  color: "primary.main",
                }}
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  action,
  borderBottom = true,
  alignTop = false,
}) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: alignTop ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: theme.spacing(2),
        py: theme.spacing(1.5),
        borderBottom: borderBottom
          ? `1px solid ${theme.palette.divider}`
          : "none",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={500}
          sx={{ fontSize: theme.typography.body2.fontSize }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 0.25,
              display: "block",
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ flexShrink: 0 }}>{action}</Box>
    </Box>
  );
};

const SectionIntro: React.FC<{ title: string; description?: string }> = ({
  title,
  description,
}) => {
  const theme = useTheme();
  return (
    <Box sx={{ mb: theme.spacing(2) }}>
      <Typography
        variant="h6"
        fontWeight={600}
        sx={{ fontSize: theme.typography.h6.fontSize }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            fontSize: theme.typography.body2.fontSize,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const { logout } = useAuth();
  const [userEmail, setUserEmail] = useState<string>("—");
  
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
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});

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
    if (activeTab === "system") {
      setLogs(logger.getLogs());
      const loadStats = async () => {
        const stats: Record<string, number> = {};
        for (const table of db.tables) {
          stats[table.name] = await table.count();
        }
        setDbStats(stats);
      };
      loadStats();
    }
  }, [activeTab]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" = "success",
  ) => setSnackbar({ open: true, message, severity });

  const handleSync = async () => {
    if (!isOnline) {
      showSnackbar("You are offline. Sync unavailable.", "error");
      return;
    }
    setIsSyncing(true);
    try {
      await syncService.pushUpdates();
      await syncService.pullAll();
      showSnackbar("Sync complete.");
    } catch {
      showSnackbar("Sync failed. Try again.", "error");
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
    navigator.clipboard
      .writeText(text)
      .then(() => showSnackbar("Logs copied."));
  };

  const logLevelColor = (level: string) => {
    if (level === "error") return theme.palette.error.main;
    if (level === "warn") return theme.palette.warning.main;
    return theme.palette.text.secondary;
  };

  const totalDbRecords = useMemo(
    () => Object.values(dbStats).reduce((a, b) => a + b, 0),
    [dbStats],
  );

  return (
    <Box
      id="main-content"
      sx={{
        maxWidth: 680,
        mx: "auto",
        px: theme.spacing(2),
        py: theme.spacing(3),
      }}
    >
      {/* Page title */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ mb: theme.spacing(2.5), fontSize: theme.typography.h5.fontSize }}
      >
        Settings
      </Typography>

      {/* Tab bar */}
      <Paper
        variant="outlined"
        sx={{
          mb: theme.spacing(3),
          borderRadius: `${theme.shape.borderRadius}px`,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tabValueToIndex(activeTab)}
          onChange={(_, v) => setActiveTab(indexToTabValue(v))}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              minHeight: 44,
              fontSize: theme.typography.body2.fontSize,
              fontWeight: 500,
              textTransform: "none",
            },
          }}
        >
          <Tab label="Account" />
          <Tab label="System" />
          <Tab label="Appearance" />
        </Tabs>
      </Paper>

      {/* ── Account tab ── */}
      {activeTab === "account" && (
        <Stack spacing={theme.spacing(3)}>
          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <SectionIntro
              title="Account"
              description="Your login and session details."
            />
            <SettingsRow
              label="Email"
              description={userEmail}
              action={null}
              borderBottom={false}
            />
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <SectionIntro title="Session" />
            <SettingsRow
              label="Sign out"
              description="End your current session."
              borderBottom={false}
              action={
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={logout}
                  sx={{ minHeight: 36 }}
                >
                  Sign out
                </Button>
              }
            />
          </Paper>
        </Stack>
      )}

      {/* ── System tab ── */}
      {activeTab === "system" && (
        <Stack spacing={theme.spacing(3)}>
          {/* Sync */}
          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <SectionIntro
              title="Sync"
              description="Keep your data up to date across devices."
            />
            <SettingsRow
              label="Connection"
              action={
                <Chip
                  size="small"
                  icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
                  label={isOnline ? "Online" : "Offline"}
                  color={isOnline ? "success" : "default"}
                  sx={{ fontSize: theme.typography.caption.fontSize }}
                />
              }
            />
            <SettingsRow
              label="Sync data"
              description="Push and pull changes from the server."
              borderBottom={false}
              action={
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SyncingIcon />}
                  disabled={isSyncing || !isOnline}
                  onClick={handleSync}
                  sx={{ minHeight: 36 }}
                >
                  {isSyncing ? "Syncing…" : "Sync now"}
                </Button>
              }
            />
          </Paper>

          {/* Database */}
          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <SectionIntro
              title="Local database"
              description={`${totalDbRecords.toLocaleString()} total records across ${Object.keys(dbStats).length} tables.`}
            />
            {Object.entries(dbStats).map(([table, count], i, arr) => (
              <SettingsRow
                key={table}
                label={table}
                borderBottom={i < arr.length - 1}
                action={
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: theme.typography.caption.fontSize }}
                  >
                    {count.toLocaleString()}
                  </Typography>
                }
              />
            ))}
          </Paper>

          {/* Logs */}
          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: theme.spacing(1.5) }}
            >
              <SectionIntro
                title="Debug logs"
                description={`${logs.length} entries`}
              />
              <Stack direction="row" spacing={1}>
                <Tooltip title="Copy logs">
                  <span>
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      disabled={logs.length === 0}
                      onClick={handleCopyLogs}
                      sx={{
                        minHeight: 36,
                        fontSize: theme.typography.caption.fontSize,
                      }}
                    >
                      Copy
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Clear logs">
                  <span>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<ClearIcon />}
                      disabled={logs.length === 0}
                      onClick={handleClearLogs}
                      sx={{
                        minHeight: 36,
                        fontSize: theme.typography.caption.fontSize,
                      }}
                    >
                      Clear
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>

            {logs.length === 0 ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: theme.typography.caption.fontSize }}
              >
                No logs yet.
              </Typography>
            ) : (
              <Box
                sx={{
                  maxHeight: 240,
                  overflowY: "auto",
                  bgcolor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: `${theme.shape.borderRadius * 0.75}px`,
                  p: theme.spacing(1.5),
                }}
              >
                {logs.map((log, i) => (
                  <Box key={i} sx={{ mb: theme.spacing(0.5) }}>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: theme.typography.fontFamily,
                        // Minimum 12px floor — was 0.6875rem (11px) before
                        fontSize: theme.typography.caption.fontSize,
                        color: logLevelColor(log.level),
                        display: "block",
                        lineHeight: 1.5,
                        wordBreak: "break-word",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ color: theme.palette.text.secondary, mr: 0.75 }}
                      >
                        [{log.level.toUpperCase()}]
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          color: theme.palette.text.disabled,
                          mr: 0.75,
                          fontSize: theme.typography.caption.fontSize,
                        }}
                      >
                        {log.timestamp}
                      </Box>
                      {log.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Stack>
      )}

      {/* ── Appearance tab ── */}
      {activeTab === "appearance" && (
        <Stack spacing={theme.spacing(3)}>
          <Paper
            variant="outlined"
            sx={{
              p: theme.spacing(2.5),
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            <SectionIntro
              title="Theme"
              description="Choose how CourtSight looks and feels."
            />
            {availablePresets.length === 0 && (
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{ fontSize: theme.typography.body2.fontSize }}
              >
                No themes available.
              </Alert>
            )}
            <Grid container spacing={theme.spacing(1.5)}>
              {availablePresets.map((preset) => (
                <Grid item xs={6} sm={4} key={preset.id}>
                  <PresetCard
                    preset={preset}
                    selected={presetId === preset.id}
                    onSelect={() => setPresetId(preset.id)}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Stack>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ fontSize: theme.typography.body2.fontSize }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
