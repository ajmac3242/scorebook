import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { buildTheme, PRESETS, DEFAULT_PRESET_ID } from "../theme";

const defaultPreset =
  PRESETS.find((p) => p.id === DEFAULT_PRESET_ID) || PRESETS[0];
const theme = buildTheme(defaultPreset);

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route, ...options }: RenderWithProvidersOptions = {},
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const RouterComponent = route
      ? ({ children: c }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={[route]}>{c}</MemoryRouter>
        )
      : ({ children: c }: { children: React.ReactNode }) => (
          <BrowserRouter>{c}</BrowserRouter>
        );

    return (
      <RouterComponent>
        <ThemeProvider theme={theme}>
          <CourtSightThemeProvider
            presets={PRESETS}
            defaultPresetId={DEFAULT_PRESET_ID}
          >
            {children}
          </CourtSightThemeProvider>
        </ThemeProvider>
      </RouterComponent>
    );
  };
  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
