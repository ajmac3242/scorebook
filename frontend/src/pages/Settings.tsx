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
  Divider,
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
  Refresh as SyncIcon,
  Warning as WarningIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { UserPool } from "../UserPool";
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
  action?: React.ReactNode;
  children?: React.ReactNode;
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

const modeLabel = (mode: ThemePreset["mode"]) =>
  mode === "light" ? "light" : "dark";

const ThemeMiniPreview: React.FC<{ color: string; selected: boolean }> = ({
  color,
  selected,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: `${theme.shape.borderRadius * 1.25}px`,
        border: `1px solid ${
          selected ? theme.palette.primary.main : theme.palette.divider
        }`,
        overflow: "hidden",
        bgcolor: "background.paper",
        position: "relative",
      }}
    >
      <Box
        sx={{
          height: 8,
          bgcolor: color,
        }}
      />
      <Box sx={{ p: 1.5, bgcolor: "background.default" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "30% 1fr",
            minHeight: 86,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              borderRight: `1px solid ${theme.palette.divider}`,
              p: 1,
              bgcolor: "background.default",
            }}
          >
            <Box
              sx={{
                height: 6,
                width: "72%",
                borderRadius: 999,
                bgcolor: "action.hover",
                mb: 0.75,
              }}
            />
            <Box
              sx={{
                height: 6,
                width: "52%",
                borderRadius: 999,
                bgcolor: "action.hover",
                mb: 0.5,
              }}
            />
            <Box
              sx={{
                height: 6,
                width: "60%",
                borderRadius: 999,
                bgcolor: "action.hover",
              }}
            />
          </Box>

          <Box sx={{ p: 1 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Box
                sx={{
                  flex: 1,
                  height: 28,
                  borderRadius: `${theme.shape.borderRadius * 0.75}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: "background.default",
                }}
              />
              <Box
                sx={{
                  flex: 1,
                  height: 28,
                  borderRadius: `${theme.shape.borderRadius * 0.75}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: "background.default",
                }}
              />
            </Stack>
            <Box
              sx={{
                height: 6,
                width: "74%",
                borderRadius: 999,
                bgcolor: "action.hover",
                mb: 0.75,
              }}
            />
            <Box
              sx={{
                height: 6,
                width: "58%",
                borderRadius: 999,
                bgcolor: "action.hover",
                mb: 0.5,
              }}
            />
            <Box
              sx={{
                height: 6,
                width: "68%",
                borderRadius: 999,
                bgcolor: "action.hover",
              }}
            />
          </Box>
        </Box>
      </Box>

      {selected && (
        <Box
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
          }}
        >
          <CheckIcon sx={{ fontSize: 14 }} />
        </Box>
      )}
    </Box>
  );
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
        height: "100%",
        border: `${
          selected ? 2 : 1
        }px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius * 1.5}px`,
        boxShadow: "none",
        bgcolor: "background.paper",
        transition: `border-color ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut},
          box-shadow ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut},
          transform ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
        "&:hover": {
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          transform: "translateY(-1px)",
        },
      }}
    >
      <CardActionArea
        onClick={onSelect}
        sx={{
          height: "100%",
          alignItems: "stretch",
          borderRadius: "inherit",
          display: "flex",
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            p: 1.5,
            "&:last-child": { pb: 1.5 },
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <ThemeMiniPreview color={preset.previewColor} selected={selected} />

          <Box>
            <Typography
              sx={{
                fontSize: theme.typography.body1.fontSize,
                fontWeight: 600,
                color: "text.primary",
                mb: 0.25,
              }}
            >
              {preset.label}
            </Typography>
            <Typography
              sx={{
                fontSize: theme.typography.caption.fontSize,
                color: "text.secondary",
                textTransform: "lowercase",
              }}
            >
              {modeLabel(preset.mode)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  action,
  children,
  borderBottom = true,
  alignTop = false,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
        gap: { xs: 1.5, md: 3 },
        py: 3,
        minHeight: 72,
        borderBottom: borderBottom
          ? `1px solid ${theme.palette.divider}`
          : "none",
      }}
    >
      <Box sx={{ pr: { md: 2 } }}>
        <Typography
          sx={{
            fontSize: theme.typography.body2.fontSize,
            fontWeight: 600,
            color: "text.primary",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: "text.secondary",
              lineHeight: 1.6,
              maxWidth: 240,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: alignTop ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 2,
          minWidth: 0,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ minWidth: 0, flex: children ? 1 : "unset" }}>{children}</Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
    </Box>
  );
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string>("—");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

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

  const totalDbRecords = useMemo(
    () => Object.values(dbStats).reduce((a, b) => a + b, 0),
    [dbStats],
  );

  const activePreset = useMemo(
    () =>
      availablePresets.find((preset) => preset.id === presetId) ??
      availablePresets[0],
    [availablePresets, presetId],
  );

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" = "success",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

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

    navigator.clipboard.writeText(text).then(() => {
      showSnackbar("Logs copied.");
    });
  };

  const renderAppearanceTab = () => (
    <Box sx={{ pt: 3 }}>
      <Typography
        sx={{
          fontSize: theme.typography.h6.fontSize,
          fontWeight: 600,
          color: "text.primary",
          mb: 0.75,
        }}
      >
        Appearance
      </Typography>
      <Typography
        sx={{
          fontSize: theme.typography.body2.fontSize,
          color: "text.secondary",
          lineHeight: 1.6,
          mb: 2.5,
        }}
      >
        Change how your application looks and feels.
      </Typography>

      <SettingsRow
        label="Color theme"
        description="Select a theme for the application interface."
      >
        {activePreset && (
          <Chip
            icon={
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  bgcolor: activePreset.previewColor,
                  ml: 0.5,
                }}
              />
            }
            label={activePreset.label}
            variant="outlined"
            sx={{
              height: 36,
              borderRadius: `${theme.shape.borderRadius}px`,
              borderColor: "divider",
              bgcolor: "background.paper",
              "& .MuiChip-label": {
                px: 1.25,
                fontSize: theme.typography.body2.fontSize,
                color: "text.primary",
              },
            }}
          />
        )}
      </SettingsRow>

      <SettingsRow
        label="Theme presets"
        description="Choose how the app should appear across the interface."
        borderBottom={false}
        alignTop
      >
        <Box sx={{ width: "100%" }}>
          {availablePresets.length === 0 ? (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ fontSize: theme.typography.body2.fontSize }}
            >
              No themes available.
            </Alert>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {availablePresets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  selected={preset.id === presetId}
                  onSelect={() => setPresetId(preset.id)}
                />
              ))}
            </Box>
          )}
        </Box>
      </SettingsRow>
    </Box>
  );

  const renderAccountTab = () => (
    <Box sx={{ pt: 3 }}>
      <Typography
        sx={{
          fontSize: theme.typography.h6.fontSize,
          fontWeight: 600,
          color: "text.primary",
          mb: 0.75,
        }}
      >
        Account
      </Typography>
      <Typography
        sx={{
          fontSize: theme.typography.body2.fontSize,
          color: "text.secondary",
          lineHeight: 1.6,
          mb: 2.5,
        }}
      >
        Manage your session and account details.
      </Typography>

      <SettingsRow
        label="Email"
        description="The email associated with your account."
        action={
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: "text.primary",
              fontWeight: 500,
            }}
          >
            {userEmail}
          </Typography>
        }
      />

      <SettingsRow
        label="Session"
        description="End your current session on this device."
        borderBottom={false}
        action={
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{
              minHeight: 40,
              borderRadius: `${theme.shape.borderRadius}px`,
            }}
          >
            Sign out
          </Button>
        }
      />
    </Box>
  );

  const renderSystemTab = () => (
    <Box sx={{ pt: 3 }}>
      <Typography
        sx={{
          fontSize: theme.typography.h6.fontSize,
          fontWeight: 600,
          color: "text.primary",
          mb: 0.75,
        }}
      >
        System
      </Typography>
      <Typography
        sx={{
          fontSize: theme.typography.body2.fontSize,
          color: "text.secondary",
          lineHeight: 1.6,
          mb: 2.5,
        }}
      >
        Monitor sync health, inspect local storage, and review logs.
      </Typography>

      <SettingsRow
        label="Connection"
        description="Current network and sync availability."
        action={
          <Stack direction="row" spacing={1}>
            <Chip
              size="small"
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "default"}
              sx={{ borderRadius: `${theme.shape.borderRadius}px` }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SyncIcon />}
              disabled={isSyncing || !isOnline}
              onClick={handleSync}
              sx={{
                minHeight: 36,
                borderRadius: `${theme.shape.borderRadius}px`,
              }}
            >
              {isSyncing ? "Syncing…" : "Sync now"}
            </Button>
          </Stack>
        }
      />

      <SettingsRow
        label="Local database"
        description={`${totalDbRecords.toLocaleString()} total records across ${
          Object.keys(dbStats).length
        } tables.`}
        alignTop
      >
        <Stack spacing={1} sx={{ width: "100%" }}>
          {Object.entries(dbStats).map(([table, count]) => (
            <Stack
              key={table}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                py: 0.75,
                px: 1.25,
                borderRadius: `${theme.shape.borderRadius}px`,
                bgcolor: "background.default",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: theme.typography.body2.fontSize,
                  color: "text.primary",
                }}
              >
                {table}
              </Typography>
              <Typography
                sx={{
                  fontSize: theme.typography.caption.fontSize,
                  color: "text.secondary",
                  fontWeight: 600,
                }}
              >
                {count.toLocaleString()}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </SettingsRow>

      <SettingsRow
        label="Debug logs"
        description={`${logs.length} entries available.`}
        borderBottom={false}
        alignTop
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Copy logs">
              <span>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                  disabled={logs.length === 0}
                  onClick={handleCopyLogs}
                  sx={{ minHeight: 36 }}
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
                  sx={{ minHeight: 36 }}
                >
                  Clear
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      >
        {logs.length === 0 ? (
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: "text.secondary",
            }}
          >
            No logs yet.
          </Typography>
        ) : (
          <Box
            sx={{
              width: "100%",
              maxHeight: 240,
              overflowY: "auto",
              bgcolor: "background.default",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${theme.shape.borderRadius * 1.25}px`,
              p: 1.5,
            }}
          >
            {logs.map((log, index) => (
              <Box key={`${log.timestamp}-${index}`} sx={{ mb: 0.75 }}>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: theme.typography.caption.fontSize,
                    color:
                      log.level === "error"
                        ? "error.main"
                        : log.level === "warn"
                          ? "warning.main"
                          : "text.secondary",
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                  }}
                >
                  <Box
                    component="span"
                    sx={{ color: "text.secondary", mr: 0.75 }}
                  >
                    [{log.level.toUpperCase()}]
                  </Box>
                  <Box
                    component="span"
                    sx={{ color: "text.disabled", mr: 0.75 }}
                  >
                    {log.timestamp}
                  </Box>
                  {log.message}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </SettingsRow>
    </Box>
  );

  return (
    <Box
      id="main-content"
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          borderRadius: `${theme.shape.borderRadius * 2}px`,
          overflow: "hidden",
          bgcolor: "background.paper",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <Box sx={{ px: { xs: 2.5, md: 3 }, pt: { xs: 2.5, md: 3 } }}>
          <Typography
            variant="h5"
            sx={{
              mb: 2,
            }}
          >
            Settings
          </Typography>

          <Tabs
            value={tabValueToIndex(activeTab)}
            onChange={(_, value) => setActiveTab(indexToTabValue(value))}
            aria-label="Settings sections"
          >
            <Tab label="Account" />
            <Tab label="System" />
            <Tab label="Appearance" />
          </Tabs>
        </Box>

        <Divider />

        <Box sx={{ px: { xs: 2.5, md: 3 }, pb: { xs: 3, md: 4 } }}>
          {activeTab === "account" && renderAccountTab()}
          {activeTab === "system" && renderSystemTab()}
          {activeTab === "appearance" && renderAppearanceTab()}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ fontSize: theme.typography.body2.fontSize }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
