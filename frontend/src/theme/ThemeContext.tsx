import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { ThemeProvider, type Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import buildTheme from "./buildTheme";
import type { ThemePreset } from "./tokens/tokens";

// Re-export so consumers can import ThemePreset from this file
// without needing to know where it's defined internally.
export type { ThemePreset };

const STORAGE_KEY = "courtsight_preset_id";

interface ThemeContextValue {
  presetId: string;
  setPresetId: (_id: string) => void;
  availablePresets: ThemePreset[];
  activePreset: ThemePreset;
  theme: Theme;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

/**
 *
 */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error("useAppTheme must be used inside CourtSightThemeProvider");
  }
  return ctx;
}

interface Props {
  presets: ThemePreset[];
  defaultPresetId?: string;
  children: ReactNode;
}

/**
 *
 * @param root0
 * @param root0.presets
 * @param root0.defaultPresetId
 * @param root0.children
 */
export function CourtSightThemeProvider({
  presets,
  defaultPresetId,
  children,
}: Props) {
  const fallbackPreset = presets[0];
  const fallbackId = defaultPresetId ?? fallbackPreset?.id ?? "";

  const [presetId, setPresetIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? fallbackId;
    } catch {
      return fallbackId;
    }
  });

  const setPresetId = (id: string) => {
    setPresetIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Ignore storage failures
    }
  };

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? fallbackPreset,
    [presets, presetId, fallbackPreset],
  );

  const theme = useMemo(() => buildTheme(activePreset), [activePreset]);

  const value = useMemo(
    () => ({
      presetId,
      setPresetId,
      availablePresets: presets,
      activePreset,
      theme,
    }),
    [presetId, presets, activePreset, theme],
  );

  if (!activePreset) {
    throw new Error("CourtSightThemeProvider requires at least one preset");
  }

  return (
    <ThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}

export default ThemeCtx;
