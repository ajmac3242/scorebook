import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
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
  ManageAccounts as AccountIcon,
  Computer as SystemIcon,
  Article as LogsIcon,
  MonitorHeart as StatusIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger, type LogEntry } from "../utils/logger";
import EntityBanner from "../components/EntityBanner";
import { db } from "../db";
import { useAppTheme, ThemePreset } from "../theme/ThemeContext";

type SettingsSection = "account" | "system" | "appearance";

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface PresetCardProps {
  preset: ThemePreset;
  selected: boolean;
  onSelect: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, selected, onSelect }) => (
  <Card
    variant="outlined"
    sx={{
      borderColor: selected ? "primary.main" : "divider",
      borderWidth: selected ? 2 : 1,
      borderRadius: 2,
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: selected ? 2 : 0,
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

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ ml: "52px" }}>
      {subtitle}
    </Typography>
  </Box>
);

const AccountSection: React.FC<{ onLogoutClick: () => void }> = ({ onLogoutClick }) => (
  <Box>
    <SectionHeader
      icon={<AccountIcon fontSize="small" />}
      title="Account"
      subtitle="Manage your login and session"
    />
    <Divider sx={{ mb: 3 }} />
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Box>
        <Typography variant="body1" fontWeight={600}>
          Sign out of CourtSight
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You will be redirected to the login screen.
        </Typography>
      </Box>
      <Button
        variant="contained"
        color="error"
        size="medium"
        startIcon={<LogoutIcon />}
        onClick={onLogoutClick}
        sx={{ borderRadius: 2, flexShrink: 0 }}
      >
        Log Out
      </Button>
    </Box>
  </Box>
);

interface SystemSectionProps {
  isOnline: boolean;
  isSyncing: boolean;
  hasUnsynced: boolean;
  logs: LogEntry[];
  isCopied: boolean;
  onCopyLogs: () => void;
  onClearLogs: () => void;
}

const SystemSection: React.FC<SystemSectionProps> = ({
  isOnline,
  isSyncing,
  hasUnsynced,
  logs,
  isCopied,
  onCopyLogs,
  onClearLogs,
}) => (
  <Box>
    <SectionHeader
      icon={<SystemIcon fontSize="small" />}
      title="System"
      subtitle="Live status and diagnostic logs"
    />
    <Divider sx={{ mb: 3 }} />

    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <StatusIcon fontSize="small" color="action" />
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        System Status
      </Typography>
    </Box>
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          bgcolor: "background.default",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Network Connection
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isOnline ? "Connected to the internet" : "No internet connection detected"}
          </Typography>
        </Box>
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
          border: "1px solid",
          borderColor: "divider",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Synchronization
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isSyncing
              ? "Syncing data to server…"
              : hasUnsynced
                ? "Changes are pending upload"
                : "All data is up to date"}
          </Typography>
        </Box>
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
          label={isSyncing ? "Syncing…" : hasUnsynced ? "Unsynced" : "Up to date"}
          color={isSyncing ? "secondary" : hasUnsynced ? "warning" : "default"}
          size="small"
        />
      </Box>
    </Stack>

    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
      <LogsIcon fontSize="small" color="action" />
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        System Logs
      </Typography>
      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
        <Button
          size="small"
          startIcon={isCopied ? <CheckIcon /> : <CopyIcon />}
          onClick={onCopyLogs}
          disabled={logs.length === 0}
          color={isCopied ? "success" : "primary"}
        >
          {isCopied ? "Copied" : "Copy"}
        </Button>
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClearLogs}
          disabled={logs.length === 0}
          color="error"
        >
          Clear
        </Button>
      </Box>
    </Box>

    <Paper
      elevation={0}
      sx={{
        bgcolor: "background.default",
        borderRadius: 2,
        p: 2,
        maxHeight: 320,
        overflowY: "auto",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {logs.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", fontStyle: "italic", py: 3 }}
        >
          No logs recorded yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {[...logs].reverse().map((log, index) => (
            <Box key={index}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5 }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}
              >
                {log.message}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  </Box>
);

const AppearanceSection: React.FC<{
  presetId: string;
  availablePresets: ThemePreset[];
  onSelectPreset: (id: string) => void;
}> = ({ presetId, availablePresets, onSelectPreset }) => (
  <Box>
    <SectionHeader
      icon={<PaletteIcon fontSize="small" />}
      title="Appearance"
      subtitle="Customise how CourtSight looks for you"
    />
    <Divider sx={{ mb: 3 }} />
    <Typography
      variant="subtitle2"
      fontWeight={700}
      color="text.secondary"
      sx={{ textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}
    >
      Colour Theme
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
      Choose a colour theme for CourtSight. Your selection is saved automatically.
    </Typography>
    <Grid container spacing={2}>
      {availablePresets.map((preset) => (
        <Grid size={{ xs: 6, sm: 4, md: 3 }} key={preset.id}>
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
  </Box>
);

const NAV_ITEMS: NavItem[] = [
  { id: "account", label: "Account", icon: <AccountIcon fontSize="small" />, description: "Sign out" },
  { id: "system", label: "System", icon: <SystemIcon fontSize="small" />, description: "Status & logs" },
  { id: "appearance", label: "Appearance", icon: <PaletteIcon fontSize="small" />, description: "Themes" },
];

/**
 * Settings page component.
 * Two-column layout: sidebar nav (Account / System / Appearance) + content panel.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const { presetId, setPresetId, availablePresets } = useAppTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
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
    setSnackbar({ open: true, message: "Logs copied to clipboard", severity: "success" });
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all system logs?")) {
      logger.clearLogs();
      setLogs([]);
      setSnackbar({ open: true, message: "System logs cleared", severity: "success" });
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

      <Box
        sx={{
          mt: 3,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: 1100,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: "flex-start",
        }}
      >
        {/* Sidebar Navigation */}
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 220 },
            flexShrink: 0,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            position: { md: "sticky" },
            top: { md: 80 },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
              sx={{ letterSpacing: 1 }}
            >
              Settings
            </Typography>
          </Box>
          <List disablePadding>
            {NAV_ITEMS.map((item, idx) => {
              const isActive = activeSection === item.id;
              return (
                <React.Fragment key={item.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => setActiveSection(item.id)}
                      sx={{
                        py: 1.25,
                        px: 2,
                        borderRadius: 0,
                        "&.Mui-selected": {
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                          "& .MuiListItemText-secondary": { color: "rgba(255,255,255,0.7)" },
                          "&:hover": { bgcolor: "primary.dark" },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{ minWidth: 34, color: isActive ? "inherit" : "text.secondary" }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        secondary={item.description}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: isActive ? 700 : 500,
                        }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      {isActive && <ChevronRightIcon fontSize="small" sx={{ ml: 0.5 }} />}
                    </ListItemButton>
                  </ListItem>
                  {idx < NAV_ITEMS.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>

        {/* Content Panel */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            p: { xs: 2.5, sm: 3.5 },
          }}
        >
          {activeSection === "account" && <AccountSection onLogoutClick={handleLogoutClick} />}
          {activeSection === "system" && (
            <SystemSection
              isOnline={isOnline}
              isSyncing={isSyncing}
              hasUnsynced={hasUnsynced}
              logs={logs}
              isCopied={isCopied}
              onCopyLogs={copyLogsToClipboard}
              onClearLogs={handleClearLogs}
            />
          )}
          {activeSection === "appearance" && (
            <AppearanceSection
              presetId={presetId}
              availablePresets={availablePresets}
              onSelectPreset={setPresetId}
            />
          )}
        </Paper>
      </Box>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "error.main" }}>
          <WarningIcon color="error" />
          Unsynced Changes
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have data that hasn't been synced to the server yet. If you logout now, these
            changes may be lost. Are you sure you want to logout?
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
