import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { PRESETS, DEFAULT_PRESET_ID } from "../theme";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route, ...options }: RenderWithProvidersOptions = {},
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = (
      <CourtSightThemeProvider
        presets={PRESETS}
        defaultPresetId={DEFAULT_PRESET_ID}
      >
        {children}
      </CourtSightThemeProvider>
    );

    if (route) {
      return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
    }

    return <BrowserRouter>{content}</BrowserRouter>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
