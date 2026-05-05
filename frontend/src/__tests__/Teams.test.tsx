import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Teams from "../pages/Teams";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb } from "../dbMock";
import { BrowserRouter } from "react-router-dom";
import { logger } from "../utils/logger";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

describe("Teams Component", () => {
  beforeEach(() => {
    mockDb.reset();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Teams />
        </BrowserRouter>
      </ThemeProvider>,
    );

  it("renders Teams page", async () => {
    mockDb.seed({
        teams: [{ id: "t1", name: "Team One" }]
    });
    renderComponent();
    expect(await screen.findByText(/Team One/i)).toBeInTheDocument();
  });

  it("handles error when adding team", async () => {
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    renderComponent();

    vi.spyOn(mockDb.teams, "add").mockImplementation(() => {
      throw new Error("Add failed");
    });

    fireEvent.click(screen.getByLabelText(/add new team/i));
    fireEvent.change(screen.getByLabelText(/Team Name/i), {
      target: { value: "Fail Team" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to add team"),
        expect.any(Error),
        expect.any(Object),
      );
    });
  });
});
