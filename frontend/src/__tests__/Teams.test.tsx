import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import Teams from "../pages/Teams";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockDb } from "../dbMock";
import { BrowserRouter } from "react-router-dom";
import { logger } from "../utils/logger";
import { ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme();

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Teams Component", () => {
  beforeEach(() => {
    mockDb.reset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Teams />
        </BrowserRouter>
      </ThemeProvider>,
    );

  it("renders Teams page and shows teams", async () => {
    mockDb.seed({
      teams: [
        { id: "t1", name: "Team One", primaryColor: "#154C56" },
        { id: "t2", name: "Team Two", primaryColor: "#FFFFFF" }
      ]
    });
    renderComponent();
    expect(await screen.findByText(/Team One/i)).toBeInTheDocument();
    expect(screen.getByText(/Team Two/i)).toBeInTheDocument();
  });

  it("handles favorite toggle and unmarks others", async () => {
    mockDb.seed({
      teams: [
        { id: "t1", name: "Team One", isFavorite: 0, primaryColor: "#154C56" },
        { id: "t2", name: "Team Two", isFavorite: 1, primaryColor: "#000000" }
      ],
    });
    renderComponent();

    const teamOneFav = await screen.findByLabelText(/Mark Team One as favorite/i);
    fireEvent.click(teamOneFav);

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      const t2 = mockDb.teams.data.find((t: any) => t.id === "t2");
      expect(t1?.isFavorite).toBe(1);
      expect(t2?.isFavorite).toBe(0);
    });

    fireEvent.click(screen.getByLabelText(/Remove Team One from favorites/i));
    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      expect(t1?.isFavorite).toBe(0);
    });
  });

  it("filters teams by search term and uses clear search in empty state", async () => {
    mockDb.seed({
      teams: [{ id: "t1", name: "Lakers", primaryColor: "#154C56" }],
    });
    renderComponent();

    fireEvent.click(screen.getByLabelText(/search/i));
    const searchInput = screen.getByPlaceholderText(/Search.../i);

    fireEvent.change(searchInput, { target: { value: "NonExistent" } });
    expect(await screen.findByText(/No teams matching "NonExistent"/i)).toBeInTheDocument();

    // Clear search using the button in empty state
    const clearBtn = screen.getByRole("button", { name: "Clear Search" });
    fireEvent.click(clearBtn);
    expect(screen.getByText(/Lakers/i)).toBeInTheDocument();
  });

  it("adds a team with all fields and covers field Enters and snackbar close", async () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText(/add new team/i));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText(/Team Name/i);
    fireEvent.change(nameInput, { target: { value: "Bulls" } });
    fireEvent.change(within(dialog).getByLabelText(/Description/i), { target: { value: "Dynasty" } });
    fireEvent.change(within(dialog).getByLabelText(/Logo URL/i), { target: { value: "http://logo.com" } });
    fireEvent.change(within(dialog).getByLabelText(/Fouls/i), { target: { value: "6" } });

    const periodSelect = within(dialog).getByRole("combobox", { name: /Period Type/i });
    fireEvent.mouseDown(periodSelect);
    const halvesOption = await screen.findByRole("option", { name: /Halves/i });
    fireEvent.click(halvesOption);

    const colorInput = document.getElementById("primary-color-input");
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: "#ce1141" } });
    }

    fireEvent.keyDown(nameInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockDb.teams.data.some((t: any) => t.name === "Bulls")).toBe(true);
    });

    const successMsg = await screen.findByText(/Team created successfully!/i);
    expect(successMsg).toBeInTheDocument();

    const closeBtn = screen.getByTitle(/Close/i);
    fireEvent.click(closeBtn);
    await waitFor(() => {
        expect(screen.queryByText(/Team created successfully!/i)).not.toBeInTheDocument();
    });
  });

  it("covers remaining onKeyDown fields in add dialog", async () => {
    renderComponent();

    // Spurs
    fireEvent.click(screen.getByLabelText(/add new team/i));
    let dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Team Name/i), { target: { value: "Spurs" } });
    fireEvent.keyDown(within(dialog).getByLabelText(/Description/i), { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(mockDb.teams.data.find((t: any) => t.name === "Spurs")).toBeDefined();
    });

    // Wait for dialog to close
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Nets
    fireEvent.click(screen.getByLabelText(/add new team/i));
    dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Team Name/i), { target: { value: "Nets" } });
    fireEvent.keyDown(within(dialog).getByLabelText(/Logo URL/i), { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(mockDb.teams.data.find((t: any) => t.name === "Nets")).toBeDefined();
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Jazz
    fireEvent.click(screen.getByLabelText(/add new team/i));
    dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Team Name/i), { target: { value: "Jazz" } });
    fireEvent.keyDown(within(dialog).getByLabelText(/Fouls/i), { key: "Enter", code: "Enter" });
    await waitFor(() => {
      expect(mockDb.teams.data.find((t: any) => t.name === "Jazz")).toBeDefined();
    });
  });

  it("validates empty team name", async () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText(/add new team/i));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Add$/i }));
    expect(await screen.findByText(/Team name is required/i)).toBeInTheDocument();
  });

  it("handles dialog cancel", async () => {
    renderComponent();
    fireEvent.click(screen.getByLabelText(/add new team/i));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("navigates on team card click or enter", async () => {
    mockDb.seed({
      teams: [{ id: "t1", name: "Nav Team", primaryColor: "#154C56" }],
    });
    renderComponent();

    const card = await screen.findByLabelText(/View stats for Nav Team/i);

    fireEvent.keyDown(card, { key: "Enter", code: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    fireEvent.keyDown(card, { key: " ", code: "Space" });
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");
  });

  it("handles error when adding team", async () => {
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
    renderComponent();
    mockDb.teams.add.mockImplementationOnce(() => { throw new Error("Add failed"); });

    fireEvent.click(screen.getByLabelText(/add new team/i));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Team Name/i), { target: { value: "Fail Team" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Add$/i }));

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
