import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { buildTheme, PRESETS, DEFAULT_PRESET_ID } from "../theme";
import { AuthProvider, useAuth } from "../context/AuthContext";

const defaultPreset =
  PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) || PRESETS[0];
const theme = buildTheme(defaultPreset);

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  withAuth?: boolean;
}

/**
 * Custom render function that wraps the UI component with all necessary providers:
 * - ThemeProvider (MUI)
 * - CourtSightThemeProvider (App Theme Context)
 * - AuthProvider (Authentication Context) - Optional
 * - BrowserRouter or MemoryRouter (Routing)
 *
 * @param ui - The component to render
 * @param options - Optional render options
 * @param options.route - Optional initial route for MemoryRouter
 * @param options.withAuth - Whether to include AuthProvider (defaults to true)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { route, withAuth = true, ...options }: RenderWithProvidersOptions = {},
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let content = (
      <ThemeProvider theme={theme}>
        <CourtSightThemeProvider
          presets={PRESETS}
          defaultPresetId={DEFAULT_PRESET_ID}
        >
          {withAuth ? <AuthProvider>{children}</AuthProvider> : children}
        </CourtSightThemeProvider>
      </ThemeProvider>
    );

    if (route) {
      return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
    }

    return <BrowserRouter>{content}</BrowserRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { useAuth };
