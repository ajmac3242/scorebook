import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { createTheme, ThemeProvider, Theme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

/**
 * Minimal shape expected from each preset file.
 * Full type lives in tokens.ts (DESIGN-001-A).
 */
export interface ThemePreset {
  id: string;
  label: string;
  previewColor: string;
  mode: "light" | "dark";
  palette: {
    primary: { main: string };
    secondary?: { main: string };
    background?: { default?: string; paper?: string };
    text?: { primary?: string; secondary?: string };
  };
  typography?: {
    fontFamily?: string;
  };
}

const STORAGE_KEY = "courtsight_preset_id";

interface ThemeContextValue {
  presetId: string;
  setPresetId: (_id: string) => void;
  availablePresets: ThemePreset[];
  theme: Theme;
}

const ThemeCtx = createContext<ThemeContextValue | null>(null);

/**
 *
 */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx)
    throw new Error("useAppTheme must be used inside CourtSightThemeProvider");
  return ctx;
}

/**
 *
 */
function buildMuiTheme(preset: ThemePreset): Theme {
  return createTheme({
    palette: {
      mode: preset.mode,
      primary: preset.palette.primary,
      ...(preset.palette.secondary
        ? { secondary: preset.palette.secondary }
        : {}),
      background: preset.palette.background ?? {},
      text: preset.palette.text ?? {},
    },
    typography: preset.typography ?? {},
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            overscrollBehavior: "none",
          },
        },
      },
    },
  });
}

interface Props {
  presets: ThemePreset[];
  defaultPresetId?: string;
  children: ReactNode;
}

/**
 *
 */
export function CourtSightThemeProvider({
  presets,
  defaultPresetId,
  children,
}: Props) {
  const fallbackId = defaultPresetId ?? presets[0]?.id ?? "";

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
      // Ignore storage errors
    }
  };

  const activePreset = useMemo(
    () => presets.find((p) => p.id === presetId) ?? presets[0],
    [presets, presetId],
  );

  const theme = useMemo(() => buildMuiTheme(activePreset), [activePreset]);

  const value = useMemo(
    () => ({ presetId, setPresetId, availablePresets: presets, theme }),
    [presetId, presets, theme],
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
