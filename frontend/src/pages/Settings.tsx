import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  PersonOutline as AccountIcon,
  DnsOutlined as SystemIcon,
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

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

type SectionId = "account" | "system" | "appearance";

const sectionSurfaceSx = {
  p: 3,
  borderRadius: 3,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
};

const statusRowSx = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  p: 2,
  bgcolor: "background.default",
  borderRadius: 2,
};

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

const SectionHeading: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}> = ({ title, subtitle, icon }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
      {icon}
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
    </Box>
    {subtitle ? (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    ) : null}
  </Box>
);

const AppearanceSection: React.FC<{
  presetId: string;
  availablePresets: ThemePreset[];
  onSelectPreset: (_id: string) => void;
}> = ({ presetId, availablePresets, onSelectPreset }) => (
  <Paper elevation={0} sx={sectionSurfaceSx}>
    <SectionHeading
      title="Appearance"
      subtitle="Choose a colour theme for CourtSight. Your selection is saved automatically."
      icon={<PaletteIcon color="primary" />}
    />
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      THEME
    </Typography>
    <Grid container spacing={2}>
      {availablePresets.map((preset) => (
        <Grid item xs={6} sm={4} md={3} key={preset.id}>
          <Tooltip title={preset.label} arrow>
            <span>
              <PresetCard
                preset={preset}
                selected={preset.id === presetId}
                onSelect={() => onSelectPreset(preset.id)}
              />
            </span>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  </Paper>
);

const NAV_ITEMS: NavItem[] = [
  {
    id: "account",
    label: "Account",
    icon: <AccountIcon fontSize="small" />,
    description: "Sign out",
  },
  {
    id: "system",
    label: "System",
    icon: <SystemIcon fontSize="small" />,
    description: "Status & logs",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: <PaletteIcon fontSize="small" />,
    description: "Themes",
  },
];

/**
 * Settings page component.
 * Two-column layout: sidebar nav (Account / System / Appearance) + content panel.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();

  const [activeSection, setActiveSection] = useState<SectionId>("appearance");
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

  const renderAccountSection = () => (
    <Paper elevation={0} sx={sectionSurfaceSx}>
      <SectionHeading
        title="Account"
        subtitle="Manage your local app data and sign out safely."
        icon={<AccountIcon color="primary" />}
      />

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Logging out clears local app data and removes cached sync metadata so
          the next sign-in starts fresh.
        </Typography>
        {hasUnsynced ? (
          <Chip
            icon={<WarningIcon />}
            label="Unsynced changes detected"
            color="warning"
            size="small"
          />
        ) : (
          <Chip
            label="No unsynced changes"
            color="success"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Button
        variant="contained"
        color="error"
        size="large"
        startIcon={<LogoutIcon />}
        onClick={handleLogoutClick}
        sx={{ borderRadius: 2 }}
      >
        Logout
      </Button>
    </Paper>
  );

  const renderSystemSection = () => (
    <Stack spacing={3}>
      <Paper elevation={0} sx={sectionSurfaceSx}>
        <SectionHeading
          title="System Status"
          subtitle="Current connectivity and synchronization state."
          icon={<SystemIcon color="primary" />}
        />

        <Stack spacing={2}>
          <Box sx={statusRowSx}>
            <Typography variant="body2">Network Connection</Typography>
            <Chip
              icon={isOnline ? <OnlineIcon /> : <OfflineIcon />}
              label={isOnline ? "Online" : "Offline"}
              color={isOnline ? "success" : "error"}
              size="small"
            />
          </Box>

          <Box sx={statusRowSx}>
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
      </Paper>

      <Paper elevation={0} sx={sectionSurfaceSx}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <SectionHeading
            title="System Logs"
            subtitle="Recent in-app log entries for debugging."
          />
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
    </Stack>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return renderAccountSection();
      case "system":
        return renderSystemSection();
      case "appearance":
      default:
        return (
          <AppearanceSection
            presetId={presetId}
            availablePresets={availablePresets}
            onSelectPreset={setPresetId}
          />
        );
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

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Application Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Browse settings by section.
                </Typography>
              </Box>

              <List disablePadding>
                {NAV_ITEMS.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton
                      selected={activeSection === item.id}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        secondary={item.description}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            {renderContent()}
          </Grid>
        </Grid>
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
            You have data that hasn&apos;t been synced to the server yet. If you
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
