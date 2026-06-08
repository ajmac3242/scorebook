import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CourtSightThemeProvider } from "../../theme/ThemeContext";
import PageSnackbar from "./PageSnackbar";

const wrap = (ui: React.ReactElement) =>
  render(<CourtSightThemeProvider>{ui}</CourtSightThemeProvider>);

describe("PageSnackbar", () => {
  it("renders message when open", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Sync complete."
        severity="success"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Sync complete.")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    wrap(
      <PageSnackbar
        open={false}
        message="Hidden"
        severity="success"
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders error severity without throwing", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Something went wrong."
        severity="error"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders warning severity without throwing", () => {
    wrap(
      <PageSnackbar
        open={true}
        message="Watch out."
        severity="warning"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Watch out.")).toBeInTheDocument();
  });
});
