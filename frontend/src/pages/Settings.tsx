import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  Separator,
  ScrollShadow,
  AlertDialogRoot,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogCloseTrigger,
  useOverlayState as useDisclosure,
  toast,
} from "@heroui/react";
import {
  Logout as LogoutIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  Refresh as SyncingIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  ContentCopy as CopyIcon,
  DeleteOutline as ClearIcon,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger, type LogEntry } from "../utils/logger";
import EntityBanner from "../components/EntityBanner";
import { db } from "../db";

/**
 * Settings page component.
 * Displays system status and provides account management options.
 */
const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsynced, setHasUnsynced] = useState(false);
  const { isOpen, open, close } = useDisclosure();
  const [logs, setLogs] = useState<LogEntry[]>(logger.getLogs());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    syncService.hasUnsyncedChanges().then(setHasUnsynced);

    const unsubscribe = syncService.subscribe((status) => {
      setIsSyncing(status);
      // Re-check unsynced status when sync state changes
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

  /**
   * Handles the logout button click.
   * If there are unsynced changes, a warning dialog is shown.
   */
  const handleLogoutClick = async () => {
    const hasUnsynced = await syncService.hasUnsyncedChanges();
    if (hasUnsynced) {
      open();
    } else {
      logout();
    }
  };

  /**
   * Confirms and executes the logout action from the dialog.
   */
  const confirmLogout = async () => {
    close();
    try {
      // 1. Clear local database
      await db.delete();

      // 2. Clear ETags from localStorage to ensure a fresh sync upon re-login
      const keysToRemove = [];
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

  /**
   * Copies the current logs to the clipboard.
   */
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
    toast.success("Logs copied to clipboard");
  };

  /**
   * Clears all stored logs.
   */
  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    toast.success("System logs cleared");
  };

  return (
    <div className="pb-8 space-y-6">
      <EntityBanner
        title="Settings"
        icon={<SettingsIcon />}
        subtitle="Manage your application and view system status"
        backTo="/"
      />

      <div className="mt-4 flex justify-center px-2">
        <Card className="max-w-[500px] w-full p-6 shadow-xl border-none">
          <CardHeader className="flex flex-col items-center pb-6">
            <Avatar className="w-24 h-24 text-3xl mb-4 bg-primary text-white text-center flex items-center justify-center">
              <SettingsIcon className="text-4xl" />
            </Avatar>
            <h2 className="text-3xl font-serif font-bold text-primary-900">Application Settings</h2>
            <p className="text-default-500">System Configuration</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary-900">System Status</h3>

              <div className="flex justify-between items-center p-3 bg-default-50 rounded-xl border border-default-100">
                <span className="text-sm font-medium">Network Connection</span>
                <Chip
                  variant="soft"
                  color={isOnline ? "success" : "danger"}
                  size="sm"
                  className="font-bold flex gap-1 items-center"
                >
                  {isOnline ? <OnlineIcon fontSize="small" /> : <OfflineIcon fontSize="small" />}
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </Chip>
              </div>

              <div className="flex justify-between items-center p-3 bg-default-50 rounded-xl border border-default-100">
                <span className="text-sm font-medium">Synchronization Status</span>
                <Chip
                  variant="soft"
                  color={isSyncing ? "accent" : hasUnsynced ? "warning" : "default"}
                  size="sm"
                  className="font-bold flex gap-1 items-center"
                >
                  {isSyncing ? <SyncingIcon className="spin text-sm" /> : hasUnsynced ? <WarningIcon fontSize="small" /> : <SyncingIcon fontSize="small" />}
                  <span>{isSyncing ? "Syncing..." : hasUnsynced ? "Unsynced changes" : "Up to date"}</span>
                </Chip>
              </div>
            </div>

            <Button
              variant="danger"
              fullWidth
              size="lg"
              onPress={handleLogoutClick}
              className="font-bold shadow-lg flex gap-2 items-center justify-center"
            >
              <LogoutIcon />
              <span>Logout</span>
            </Button>

            <Separator />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-primary-900">System Logs</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={copyLogsToClipboard}
                    isDisabled={logs.length === 0}
                    className="flex gap-1 items-center"
                  >
                    <CopyIcon fontSize="small" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={handleClearLogs}
                    isDisabled={logs.length === 0}
                    className="flex gap-1 items-center"
                  >
                    <ClearIcon fontSize="small" />
                    <span className="text-danger">Clear</span>
                  </Button>
                </div>
              </div>

              <ScrollShadow className="h-[200px] p-4 bg-default-50 rounded-xl border border-default-100 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-center italic text-default-400 py-4">
                    No logs recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {[...logs].reverse().map((log, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`uppercase font-black ${
                            log.level === 'error' ? 'text-danger' : log.level === 'warn' ? 'text-warning' : 'text-default-400'
                          }`}>
                            {log.level}
                          </span>
                          <span className="text-default-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="font-mono break-all text-default-700">{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialogRoot isOpen={isOpen} onOpenChange={close}>
        <AlertDialogBackdrop />
        <AlertDialogContainer>
          <AlertDialogDialog>
            <AlertDialogHeader>
              <AlertDialogHeading className="flex items-center gap-2 text-danger">
                <WarningIcon color="error" />
                Unsynced Changes
              </AlertDialogHeading>
            </AlertDialogHeader>
            <AlertDialogBody>
              <p className="text-default-500">
                You have data that hasn't been synced to the server yet. If you logout
                now, these changes may be lost. Are you sure you want to logout?
              </p>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="ghost" onPress={close}>
                Cancel
              </Button>
              <Button variant="danger" onPress={confirmLogout}>
                Logout Anyway
              </Button>
            </AlertDialogFooter>
            <AlertDialogCloseTrigger />
          </AlertDialogDialog>
        </AlertDialogContainer>
      </AlertDialogRoot>
    </div>
  );
};

export default Settings;
