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
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  DeleteOutlined as ClearIcon,
  Launch as LaunchIcon,
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

type SettingsTab =
  | "account"
  | "profile"
  | "security"
  | "appearance"
  | "notifications"
  | "billing"
  | "integrations"
  | "system";

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

const publicTabs: SettingsTab[] = [
  "account",
  "profile",
  "security",
  "appearance",
  "notifications",
  "billing",
  "integrations",
];

const tabLabel = (tab: SettingsTab): string => {
  switch (tab) {
    case "account":
      return "Account";
    case "profile":
      return "Profile";
    case "security":
      return "Security";
    case "appearance":
      return "Appearance";
    case "notifications":
      return "Notifications";
    case "billing":
      return "Billing";
    case "integrations":
      return "Integrations";
    case "system":
      return "System";
    default:
      return tab;
  }
};

const ThemeMiniPreview: React.FC<{
  color: string;
  selected: boolean;
  custom?: boolean;
}> = ({ color, selected, custom = false }) => {
  const theme = useTheme();
  const settings = (
    theme as typeof theme & {
      appTokens?: {
        settings?: {
          selectionCard?: {
            previewRadius?: number;
            checkSize?: number;
            checkOffset?: number;
          };
        };
      };
    }
  ).appTokens?.settings;

  const previewRadius = settings?.selectionCard?.previewRadius ?? 8;
  const checkSize = settings?.selectionCard?.checkSize ?? 20;
  const checkOffset = settings?.selectionCard?.checkOffset ?? 12;

  return (
    <Box
      sx={{
        borderRadius: `${previewRadius}px`,
        border: `1px solid ${
          selected ? theme.palette.primary.main : theme.palette.divider
        }`,
        overflow: "hidden",
        bgcolor: "background.paper",
        position: "relative",
        minHeight: 128,
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
            gridTemplateColumns: "1fr",
            minHeight: 92,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${previewRadius}px`,
            overflow: "hidden",
            bgcolor: "background.paper",
            position: "relative",
          }}
        >
          <Box
            sx={{
              px: 1.25,
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" spacing={0.5}>
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "#F97066",
                }}
              />
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "#FDB022",
                }}
              />
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "#32D583",
                }}
              />
            </Stack>
            <Box
              sx={{
                width: 28,
                height: 6,
                borderRadius: 999,
                bgcolor: color,
              }}
            />
          </Box>

          <Box sx={{ p: 1.25 }}>
            {custom ? (
              <Box
                sx={{
                  height: "100%",
                  minHeight: 56,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: `${Math.max(previewRadius - 2, 6)}px`,
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                }}
              >
                <Chip
                  label="Edit CSS"
                  variant="outlined"
                  sx={{
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    "& .MuiChip-label": {
                      px: 1.5,
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            ) : (
              <Stack spacing={1}>
                <Box
                  sx={{
                    height: 6,
                    width: "58%",
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                  }}
                />
                <Box
                  sx={{
                    height: 36,
                    borderRadius: `${Math.max(previewRadius - 2, 6)}px`,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: "hidden",
                    p: 0.75,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 0.5,
                  }}
                >
                  {[22, 28, 26, 32, 30, 34, 36].map((h, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: h,
                        borderRadius: 999,
                        bgcolor:
                          i % 2 === 0
                            ? alpha(theme.palette.primary.main, 0.18)
                            : alpha(theme.palette.text.primary, 0.12),
                      }}
                    />
                  ))}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      height: 5,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
                    }}
                  />
                  <Box
                    sx={{
                      width: "24%",
                      height: 5,
                      borderRadius: 999,
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
                    }}
                  />
                </Box>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {selected && (
        <Box
          sx={{
            position: "absolute",
            top: checkOffset,
            right: checkOffset,
            width: checkSize,
            height: checkSize,
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
  const settings = (
    theme as typeof theme & {
      appTokens?: {
        settings?: {
          selectionCard?: {
            radius?: number;
            borderWidth?: number;
            selectedBorderWidth?: number;
            padding?: number;
            titleGap?: number;
          };
        };
      };
    }
  ).appTokens?.settings;

  const radius = settings?.selectionCard?.radius ?? 12;
  const borderWidth = settings?.selectionCard?.borderWidth ?? 1;
  const selectedBorderWidth = settings?.selectionCard?.selectedBorderWidth ?? 2;
  const padding = settings?.selectionCard?.padding ?? 12;
  const titleGap = settings?.selectionCard?.titleGap ?? 4;

  const isCustom = preset.id.toLowerCase().includes("custom");

  return (
    <Card
      sx={{
        height: "100%",
        border: `${
          selected ? selectedBorderWidth : borderWidth
        }px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: `${radius}px`,
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
            p: `${padding}px`,
            "&:last-child": { pb: `${padding}px` },
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <ThemeMiniPreview
            color={preset.previewColor}
            selected={selected}
            custom={isCustom}
          />

          <Box>
            <Typography
              sx={{
                fontSize: theme.typography.body1.fontSize,
                fontWeight: 600,
                color: "text.primary",
                mb: `${titleGap}px`,
              }}
            >
              {preset.label}
            </Typography>
            <Typography
              sx={{
                fontSize: theme.typography.body2.fontSize,
                color: "text.secondary",
                lineHeight: 1.5,
              }}
            >
              {isCustom
                ? "Manage styling with CSS."
                : preset.id.toLowerCase().includes("simpl")
                  ? "Minimal and modern."
                  : "Default company branding."}
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
  const appTheme = theme as typeof theme & {
    appTokens?: {
      settings?: {
        row?: {
          minHeight?: number;
          paddingY?: number;
          labelWidth?: number;
          gap?: number;
          dividerColor?: string;
          descriptionMaxWidth?: number;
        };
      };
    };
  };

  const row = appTheme.appTokens?.settings?.row;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: `${row?.labelWidth ?? 280}px minmax(0, 1fr)`,
        },
        gap: { xs: 1.5, md: `${row?.gap ?? 32}px` },
        py: `${row?.paddingY ?? 24}px`,
        minHeight: `${row?.minHeight ?? 92}px`,
        borderBottom: borderBottom
          ? `1px solid ${row?.dividerColor ?? theme.palette.divider}`
          : "none",
      }}
    >
      <Box sx={{ pr: { md: 2 } }}>
        <Typography
          sx={{
            fontSize: theme.typography.body1.fontSize,
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
              maxWidth: row?.descriptionMaxWidth ?? 280,
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

const PlaceholderPanel: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  return (
    <Box sx={{ pt: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const appTheme = theme as typeof theme & {
    appTokens?: typeof import("../theme/tokens/tokens").tokens;
  };
  const settingsTokens = appTheme.appTokens?.settings;

  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string>("—");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [brandColor, setBrandColor] = useState("#444CE7");
  const [language, setLanguage] = useState("English (UK)");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
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

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    setLanguage(event.target.value);
  };

  const renderAppearanceTab = () => (
    <Box sx={{ pt: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: `${settingsTokens?.section?.introMarginBottom ?? 24}px`,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: `${settingsTokens?.section?.titleGap ?? 6}px` }}
          >
            Appearance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Change how your public dashboard looks and feels.
          </Typography>
        </Box>

        <Button
          variant="text"
          endIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
          sx={{
            color: "text.secondary",
            minHeight: 36,
            px: 0,
            "&:hover": {
              backgroundColor: "transparent",
              color: "text.primary",
            },
          }}
        >
          dashboard.untitledui.com
        </Button>
      </Box>

      <SettingsRow
        label="Brand color"
        description="Select or customize your brand color."
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
        >
          <Box
            sx={{
              width: `${settingsTokens?.control?.colorSwatchSize ?? 24}px`,
              height: `${settingsTokens?.control?.colorSwatchSize ?? 24}px`,
              borderRadius: "8px",
              bgcolor: brandColor,
              border: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
              flexShrink: 0,
            }}
          />
          <TextField
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            size="small"
            sx={{
              width: `${settingsTokens?.control?.inputWidth ?? 132}px`,
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
              },
            }}
          />
        </Stack>
      </SettingsRow>

      <SettingsRow
        label="Dashboard charts"
        description="How charts are displayed."
        alignTop
      >
        <Box sx={{ width: "100%" }}>
          <Button
            variant="text"
            sx={{
              px: 0,
              mb: 2,
              minHeight: 24,
              fontSize: theme.typography.body2.fontSize,
              color: "primary.main",
              "&:hover": { backgroundColor: "transparent" },
            }}
          >
            View examples
          </Button>

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
            {[
              ...(availablePresets.length
                ? availablePresets
                : [
                    {
                      id: "default",
                      label: "Default",
                      previewColor: theme.palette.primary.main,
                      mode: "light" as const,
                    },
                    {
                      id: "simplified",
                      label: "Simplified",
                      previewColor: "#D0D5DD",
                      mode: "light" as const,
                    },
                    {
                      id: "custom-css",
                      label: "Custom CSS",
                      previewColor: "#D0D5DD",
                      mode: "light" as const,
                    },
                  ]),
            ]
              .slice(0, 3)
              .map((preset, index) => {
                const fallbackIds = ["default", "simplified", "custom-css"];
                const normalizedPreset =
                  availablePresets.length > 0
                    ? preset
                    : {
                        ...preset,
                        id: fallbackIds[index],
                      };

                return (
                  <PresetCard
                    key={normalizedPreset.id}
                    preset={normalizedPreset as ThemePreset}
                    selected={normalizedPreset.id === presetId || index === 0}
                    onSelect={() => setPresetId(normalizedPreset.id)}
                  />
                );
              })}
          </Box>
        </Box>
      </SettingsRow>

      <SettingsRow
        label="Language"
        description="Default language for public dashboard."
      >
        <Select
          value={language}
          onChange={handleLanguageChange}
          size="small"
          sx={{
            width: `${settingsTokens?.control?.selectWidth ?? 280}px`,
            maxWidth: "100%",
          }}
        >
          <MenuItem value="English (UK)">🇬🇧 English (UK)</MenuItem>
          <MenuItem value="English (US)">🇺🇸 English (US)</MenuItem>
          <MenuItem value="French">🇫🇷 French</MenuItem>
          <MenuItem value="German">🇩🇪 German</MenuItem>
        </Select>
      </SettingsRow>

      <SettingsRow
        label="Cookie banner"
        description="Display cookie banners to visitors."
        borderBottom={false}
        alignTop
      >
        <Alert
          severity="info"
          sx={{
            width: "100%",
            borderRadius: "12px",
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            color: "text.secondary",
            "& .MuiAlert-icon": {
              color: "primary.main",
            },
          }}
        >
          This setting is ready for the same row pattern, but the final control
          set still needs product decisions.
        </Alert>
      </SettingsRow>
    </Box>
  );

  const renderAccountTab = () => (
    <Box sx={{ pt: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your session and account details.
      </Typography>

      <SettingsRow
        label="Email"
        description="The email associated with your account."
        action={
          <Typography
            variant="body2"
            sx={{ color: "text.primary", fontWeight: 500 }}
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
            sx={{ minHeight: 40 }}
          >
            Sign out
          </Button>
        }
      />
    </Box>
  );

  const renderSystemTab = () => (
    <Box sx={{ pt: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.75 }}>
        System
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor sync health, inspect local storage, and review logs.
      </Typography>

      <SettingsRow
        label="Connection"
        description="Current network and sync availability."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              size="small"
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "default"}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SyncIcon />}
              disabled={isSyncing || !isOnline}
              onClick={handleSync}
              sx={{ minHeight: 36 }}
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
                borderRadius: "10px",
                bgcolor: "background.default",
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2" sx={{ color: "text.primary" }}>
                {table}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontWeight: 600 }}
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
          <Typography variant="body2" color="text.secondary">
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
              borderRadius: "12px",
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

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return renderAccountTab();
      case "appearance":
        return renderAppearanceTab();
      case "system":
        return renderSystemTab();
      case "profile":
        return (
          <PlaceholderPanel
            title="Profile"
            description="Profile settings can now reuse the same shell, tabs, and row primitives."
          />
        );
      case "security":
        return (
          <PlaceholderPanel
            title="Security"
            description="Security settings can reuse this token-driven settings structure."
          />
        );
      case "notifications":
        return (
          <PlaceholderPanel
            title="Notifications"
            description="Notification settings can be added without inventing a new layout system."
          />
        );
      case "billing":
        return (
          <PlaceholderPanel
            title="Billing"
            description="Billing settings can plug into the same settings shell and row patterns."
          />
        );
      case "integrations":
        return (
          <PlaceholderPanel
            title="Integrations"
            description="Integration settings can share the same tokens and spacing model."
          />
        );
      default:
        return renderAppearanceTab();
    }
  };

  return (
    <Box
      id="main-content"
      sx={{
        width: "100%",
        maxWidth: `${settingsTokens?.shell?.maxWidth ?? 1280}px`,
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          borderRadius: `${settingsTokens?.shell?.radius ?? 20}px`,
          overflow: "hidden",
          bgcolor: settingsTokens?.shell?.background ?? "background.paper",
          border:
            settingsTokens?.shell?.border ??
            `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2.5,
              md: `${settingsTokens?.shell?.headerPaddingX ?? 32}px`,
            },
            pt: {
              xs: 2.5,
              md: `${settingsTokens?.shell?.headerPaddingTop ?? 28}px`,
            },
          }}
        >
          <Typography variant="h5" sx={{ mb: 2.5 }}>
            Settings
          </Typography>

          <Tabs
            value={publicTabs.indexOf(activeTab)}
            onChange={(_, value) =>
              setActiveTab(publicTabs[value] ?? "appearance")
            }
            aria-label="Settings sections"
            variant="scrollable"
            scrollButtons="auto"
          >
            {publicTabs.map((tab) => (
              <Tab key={tab} label={tabLabel(tab)} />
            ))}
          </Tabs>
        </Box>

        <Divider />

        <Box
          sx={{
            px: {
              xs: 2.5,
              md: `${settingsTokens?.shell?.contentPaddingX ?? 32}px`,
            },
            pb: {
              xs: 3,
              md: `${settingsTokens?.shell?.contentPaddingBottom ?? 32}px`,
            },
          }}
        >
          {renderContent()}
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
          icon={snackbar.severity === "warning" ? <WarningIcon /> : undefined}
          sx={{ fontSize: theme.typography.body2.fontSize }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
