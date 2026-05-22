/**
 * Settings page — full-width shell-integrated layout.
 *
 * Shell integration pattern:
 * - maxWidth: "none" to fill the AppShell workspace
 * - All spacing driven by settingsTokens.shell, .section, .row
 * - Mobile/desktop responsive via breakpoint tokens
 *
 * For constrained-width pages (modals, wizards), use shell.maxWidth.
 * For workspace pages (settings, dashboards), use "none".
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Divider,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Check as CheckIcon,
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
import { useAppTheme, ThemePreset } from "../theme/ThemeContext";
import { useTokens } from "../theme/useTokens";
import { logger, type LogEntry } from "../utils/logger";
import { syncService } from "../utils/syncService";

type SettingsTab = "account" | "system" | "appearance";

const TABS: SettingsTab[] = ["account", "system", "appearance"];

const TAB_LABELS: Record<SettingsTab, string> = {
  account: "Account",
  system: "System",
  appearance: "Appearance",
};

const SectionIntro: React.FC<{
  title: string;
  description: string;
  section: { titleGap: number; introMarginBottom: number };
}> = ({ title, description, section }) => {
  const introMarginBottom = section?.introMarginBottom ?? 20;
  const titleGap = section?.titleGap ?? 4;

  return (
    <Box sx={{ mb: `${introMarginBottom / 8}rem` }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, mb: `${titleGap / 8}rem` }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Box>
  );
};

interface SettingsRowProps {
  label: string;
  description?: string;
  children?: React.ReactNode;
  borderBottom?: boolean;
  alignTop?: boolean;
  row: {
    labelWidth: number;
    gap: number;
    minHeight: number;
    paddingY: number;
    dividerColor: string;
    descriptionMaxWidth: number;
  };
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  borderBottom = true,
  alignTop = false,
  row,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: `${row?.labelWidth ?? 260}px 1fr`,
        },
        gap: {
          xs: 1.5,
          md: `${row?.gap ?? 24}px`,
        },
        alignItems: alignTop ? "flex-start" : "center",
        minHeight: row?.minHeight ?? 80,
        py: `${(row?.paddingY ?? 20) / 8}rem`,
        ...(borderBottom && {
          borderBottom: `1px solid ${row?.dividerColor ?? theme.palette.divider}`,
        }),
      }}
    >
      <Box sx={{ maxWidth: row?.descriptionMaxWidth ?? 240 }}>
        <Typography
          variant="body2"
          color="text.primary"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>

        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5, lineHeight: 1.45 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
};

const ThemeMiniPreview: React.FC<{
  color: string;
  selected: boolean;
  card: { previewRadius: number; checkSize: number; checkOffset: number };
}> = ({ color, selected, card }) => {
  const theme = useTheme();
  const previewRadius = card?.previewRadius ?? 6;
  const checkSize = card?.checkSize ?? 18;
  const checkOffset = card?.checkOffset ?? 10;
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "4 / 3",
        borderRadius: `${previewRadius}px`,
        overflow: "hidden",
        bgcolor: isDark ? "grey.900" : "grey.100",
        border: "1px solid",
        borderColor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.08),
      }}
    >
      <Box sx={{ height: "22%", width: "100%", bgcolor: color }} />

      <Box
        sx={{
          px: 1,
          pt: 0.875,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {[62, 82, 48, 70].map((w, i) => (
          <Box
            key={i}
            sx={{
              height: 4,
              width: `${w}%`,
              borderRadius: 2,
              bgcolor: isDark ? "grey.700" : "grey.300",
            }}
          />
        ))}

        <Box sx={{ display: "flex", gap: 0.5, mt: 0.25 }}>
          <Box
            sx={{
              height: 7,
              width: "38%",
              borderRadius: 1,
              bgcolor: alpha(color, 0.55),
            }}
          />
          <Box
            sx={{
              height: 7,
              width: "28%",
              borderRadius: 1,
              bgcolor: isDark ? "grey.700" : "grey.200",
            }}
          />
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
            bgcolor: theme.palette.primary.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.18)}`,
          }}
        >
          <CheckIcon sx={{ fontSize: checkSize * 0.58, color: "#fff" }} />
        </Box>
      )}
    </Box>
  );
};

interface PresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
  card: {
    radius: number;
    borderWidth: number;
    selectedBorderWidth: number;
    padding: number;
    titleGap: number;
    previewRadius: number;
    checkSize: number;
    checkOffset: number;
  };
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  selected,
  onSelect,
  card,
}) => {
  const theme = useTheme();
  const radius = card?.radius ?? 10;
  const borderWidth = card?.borderWidth ?? 1;
  const selectedBorderWidth = card?.selectedBorderWidth ?? 2;
  const padding = card?.padding ?? 10;
  const titleGap = card?.titleGap ?? 4;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: `${radius}px`,
        border: selected
          ? `${selectedBorderWidth}px solid ${theme.palette.primary.main}`
          : `${borderWidth}px solid ${alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.16 : 0.12)}`,
        bgcolor: "background.paper",
        cursor: "pointer",
        transition:
          "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        "&:hover": {
          borderColor: selected
            ? theme.palette.primary.main
            : alpha(theme.palette.primary.main, 0.45),
          boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.22 : 0.08)}`,
          transform: "translateY(-1px)",
        },
      }}
      onClick={onSelect}
    >
      <CardActionArea disableRipple sx={{ p: `${padding}px` }}>
        <ThemeMiniPreview
          color={preset.previewColor}
          selected={selected}
          card={card}
        />

        <Box sx={{ mt: `${titleGap + 6}px` }}>
          <Typography
            variant="body2"
            color="text.primary"
            noWrap
            sx={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.2 }}
          >
            {preset.label}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "capitalize", lineHeight: 1.2 }}
          >
            {preset.mode}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const tokens = useTokens();
  const settingsTokens = tokens.settings;
  const shell = settingsTokens.shell;
  const tabs = settingsTokens.tabs;
  const section = settingsTokens.section;
  const row = settingsTokens.row;
  const selectionCard = settingsTokens.selectionCard;

  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [userEmail, setUserEmail] = useState("—");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

    navigator.clipboard
      .writeText(text)
      .then(() => showSnackbar("Logs copied."));
  };

  const renderAccountTab = () => (
    <Box>
      <SectionIntro
        title="Account"
        description="Manage your local app data and sign out safely."
        section={section}
      />

      <SettingsRow
        row={row}
        label="Email address"
        description="Your registered account email."
      >
        <Typography variant="body2" color="text.secondary">
          {userEmail}
        </Typography>
      </SettingsRow>

      <SettingsRow
        row={row}
        label="Logout"
        description="Sign out of CourtSight on this device. Local cache and stored sync metadata will be cleared."
        borderBottom={false}
      >
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
      </SettingsRow>
    </Box>
  );

  const renderAppearanceTab = () => {
    const selectWidth = settingsTokens?.control?.selectWidth ?? 260;

    return (
      <Box>
        <SectionIntro
          title="Appearance"
          description="Change how your application looks and feels."
          section={section}
        />

        <SettingsRow
          row={row}
          label="Color theme"
          description="Select a theme for the application interface."
        >
          <Select
            value={presetId}
            onChange={(e: SelectChangeEvent) => setPresetId(e.target.value)}
            size="small"
            renderValue={(value) => {
              const preset = availablePresets.find((p) => p.id === value);

              if (!preset) return String(value);

              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      bgcolor: preset.previewColor,
                      flexShrink: 0,
                    }}
                  />
                  {preset.label}
                </Box>
              );
            }}
            sx={{ width: selectWidth, maxWidth: "100%" }}
          >
            {availablePresets.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      bgcolor: p.previewColor,
                      flexShrink: 0,
                    }}
                  />
                  {p.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </SettingsRow>

        <SettingsRow
          row={row}
          label="Theme presets"
          description="Choose how the app should appear across the interface."
          alignTop
          borderBottom={false}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 180px))",
                lg: "repeat(3, minmax(0, 180px))",
              },
              gap: 1.5,
              alignItems: "start",
            }}
          >
            {availablePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                selected={presetId === preset.id}
                onSelect={() => setPresetId(preset.id)}
                card={selectionCard}
              />
            ))}
          </Box>
        </SettingsRow>
      </Box>
    );
  };

  const renderSystemTab = () => (
    <Box>
      <SectionIntro
        title="System"
        description="Monitor sync health, inspect local storage, and review logs."
        section={section}
      />

      <SettingsRow
        row={row}
        label="Sync"
        description="Manually push local changes to the cloud."
      >
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
      </SettingsRow>

      <SettingsRow
        row={row}
        label="Local storage"
        description={`${totalDbRecords.toLocaleString()} total records across ${
          Object.keys(dbStats).length
        } tables.`}
        alignTop
      >
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
      </SettingsRow>

      <SettingsRow
        row={row}
        label="Logs"
        description="Diagnostic log output from this session."
        alignTop
        borderBottom={false}
      >
        <Stack spacing={1.25}>
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
      default:
        return renderAccountTab();
    }
  };

  return (
    <Box
      id="main-content"
      sx={{
        width: "100%",
        maxWidth: "none",
        mx: 0,
      }}
    >
      <Box
        sx={{
          px: {
            xs: 2.5,
            md: `${(shell?.headerPaddingX ?? 28) / 8}rem`,
          },
          pt: {
            xs: 2.5,
            md: `${(shell?.headerPaddingTop ?? 28) / 8}rem`,
          },
          pb: 0,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Settings
        </Typography>

        <Tabs
          value={TABS.indexOf(activeTab)}
          onChange={(_e, v) => setActiveTab(TABS[v] ?? "account")}
          aria-label="Settings sections"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: tabs?.height ?? 40,
            mt: 0.5,
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              minHeight: tabs?.height ?? 40,
              px: `${(tabs?.paddingX ?? 12) / 8}rem`,
            },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab} label={TAB_LABELS[tab]} />
          ))}
        </Tabs>
      </Box>

      <Divider />

      <Box
        sx={{
          px: {
            xs: 2.5,
            md: `${(shell?.contentPaddingX ?? 28) / 8}rem`,
          },
          pt: 2,
          pb: {
            xs: 2.5,
            md: `${(shell?.contentPaddingBottom ?? 28) / 8}rem`,
          },
        }}
      >
        {renderContent()}
      </Box>

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
    </Box>
  );
};

export default Settings;
