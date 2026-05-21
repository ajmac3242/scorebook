import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider, type Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import buildTheme from "./buildTheme";
import PRESETS, { DEFAULT_PRESET_ID } from "./presets";
import type { ThemePreset } from "./tokens/tokens";

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

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) {
    throw new Error("useAppTheme must be used inside CourtSightThemeProvider");
  }
  return ctx;
}

interface Props {
  presets?: ThemePreset[];
  defaultPresetId?: string;
  children: ReactNode;
}

export function CourtSightThemeProvider({
  presets = PRESETS,
  defaultPresetId = DEFAULT_PRESET_ID,
  children,
}: Props) {
  const fallbackPreset = presets[0];

  if (!fallbackPreset) {
    throw new Error("CourtSightThemeProvider requires at least one preset");
  }

  const fallbackId = defaultPresetId ?? fallbackPreset.id;

  const [presetIdState, setPresetIdState] = useState<string>(() => {
    try {
      const storedPresetId = localStorage.getItem(STORAGE_KEY);
      return storedPresetId ?? fallbackId;
    } catch {
      return fallbackId;
    }
  });

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === presetIdState) ?? fallbackPreset,
    [presets, presetIdState, fallbackPreset],
  );

  const presetId = activePreset.id;

  const setPresetId = (id: string) => {
    const nextId = presets.some((preset) => preset.id === id) ? id : fallbackId;

    setPresetIdState(nextId);

    try {
      localStorage.setItem(STORAGE_KEY, nextId);
    } catch {
      // Ignore storage failures.
    }
  };

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