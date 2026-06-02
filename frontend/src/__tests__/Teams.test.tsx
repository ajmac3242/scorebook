import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CourtSightThemeProvider } from "../theme/ThemeContext";
import { PRESETS } from "../theme/presets";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Teams from "../pages/Teams";
import { mockDb } from "../dbMock";

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
    mockNavigate.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () =>
    render(
      <CourtSightThemeProvider presets={PRESETS} defaultPresetId="classic">
        <BrowserRouter>
          <Teams />
        </BrowserRouter>
      </CourtSightThemeProvider>,
    );

  const getCreateTeamButton = () => {
    return (
      screen.queryByRole("button", { name: /add team/i }) ||
      screen.queryByRole("button", { name: /create first team/i }) ||
      screen.queryByRole("button", { name: /create team now/i }) ||
      screen.queryByRole("button", { name: /create team/i })
    );
  };

  const openCreateDialog = async () => {
    renderComponent();

    const trigger = getCreateTeamButton();
    expect(trigger).toBeTruthy();

    fireEvent.click(trigger as HTMLElement);

    return await screen.findByRole("dialog");
  };

  const clickNext = async (dialog: HTMLElement) => {
    const nextButton =
      within(dialog).queryByRole("button", { name: /^next$/i }) ||
      within(dialog).queryByRole("button", { name: /continue/i }) ||
      within(dialog).queryByRole("button", { name: /review/i });

    expect(nextButton).toBeTruthy();
    fireEvent.click(nextButton as HTMLElement);
  };

  const fillWorkflow = async (
    dialog: HTMLElement,
    overrides?: {
      name?: string;
      description?: string;
      logoUrl?: string;
      fouls?: string;
    },
  ) => {
    fireEvent.change(within(dialog).getByLabelText(/team name/i), {
      target: { value: overrides?.name ?? "Bulls" },
    });

    if (overrides?.description !== undefined) {
      const descriptionField =
        within(dialog).queryByLabelText(/description/i) ||
        within(dialog).queryByLabelText(/team description/i);

      if (descriptionField) {
        fireEvent.change(descriptionField, {
          target: { value: overrides.description },
        });
      }
    }

    await clickNext(dialog);

    if (overrides?.logoUrl !== undefined) {
      const logoUrlField =
        within(dialog).queryByLabelText(/logo url/i) ||
        within(dialog).queryByLabelText(/logo/i);

      if (logoUrlField) {
        fireEvent.change(logoUrlField, {
          target: { value: overrides.logoUrl },
        });
      }
    }

    await clickNext(dialog);

    if (overrides?.fouls !== undefined) {
      const foulsField =
        within(dialog).queryByLabelText(/fouls/i) ||
        within(dialog).queryByLabelText(/team fouls/i);

      if (foulsField) {
        fireEvent.change(foulsField, {
          target: { value: overrides.fouls },
        });
      }
    }

    const periodSelect = within(dialog).queryByRole("combobox", {
      name: /period type/i,
    });

    if (periodSelect) {
      fireEvent.mouseDown(periodSelect);

      const halvesOption = await screen.findByRole("option", {
        name: /halves/i,
      });
      fireEvent.click(halvesOption);
    }

    await clickNext(dialog);
  };

  const getSearchInput = () => {
    return (
      screen.queryByRole("textbox", { name: /search/i }) ||
      screen.queryByPlaceholderText(/search/i)
    );
  };

  const getSubmitButton = (dialog: HTMLElement) => {
    return (
      within(dialog).queryByRole("button", { name: /^create$/i }) ||
      within(dialog).queryByRole("button", { name: /create team/i }) ||
      within(dialog).queryByRole("button", { name: /save team/i }) ||
      within(dialog).queryByRole("button", { name: /save/i }) ||
      within(dialog).queryByRole("button", { name: /finish/i }) ||
      within(dialog).queryByRole("button", { name: /submit/i }) ||
      dialog.querySelector('button[type="submit"]') ||
      Array.from(within(dialog).queryAllByRole("button")).find(
        (button) => !/cancel|back|previous/i.test(button.textContent || ""),
      ) ||
      null
    );
  };

  it("renders teams from the store", async () => {
    mockDb.seed({
      teams: [
        { id: "t1", name: "Team One", primaryColor: "#154C56" },
        { id: "t2", name: "Team Two", primaryColor: "#FFFFFF" },
      ],
    });

    renderComponent();

    expect(await screen.findByText(/Team One/i)).toBeInTheDocument();
    expect(screen.getByText(/Team Two/i)).toBeInTheDocument();
  });

  it("toggles favorite status and unmarks other favorites", async () => {
    mockDb.seed({
      teams: [
        { id: "t1", name: "Team One", isFavorite: 0, primaryColor: "#154C56" },
        { id: "t2", name: "Team Two", isFavorite: 1, primaryColor: "#000000" },
      ],
    });

    renderComponent();

    const favoriteButton = await screen.findByLabelText(
      /mark team one as favorite/i,
    );
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      const t2 = mockDb.teams.data.find((t: any) => t.id === "t2");
      expect(t1?.isFavorite).toBe(1);
      expect(t2?.isFavorite).toBe(0);
    });

    fireEvent.click(screen.getByLabelText(/remove team one from favorites/i));

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      expect(t1?.isFavorite).toBe(0);
    });
  });

  it("filters teams by search term and clears search from the empty state", async () => {
    mockDb.seed({
      teams: [{ id: "t1", name: "Lakers", primaryColor: "#154C56" }],
    });

    renderComponent();

    const searchInput = getSearchInput();
    expect(searchInput).toBeTruthy();

    fireEvent.change(searchInput as HTMLElement, {
      target: { value: "NonExistent" },
    });

    expect(
      await screen.findByText(/No results for "NonExistent"/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /clear search/i }));

    expect(screen.getByText(/Lakers/i)).toBeInTheDocument();
  });

  it("adds a team successfully and shows a success snackbar", async () => {
    const dialog = await openCreateDialog();

    await fillWorkflow(dialog, {
      name: "Bulls",
      description: "Dynasty",
      logoUrl: "http://logo.com",
      fouls: "6",
    });

    const submitButton = getSubmitButton(dialog);
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockDb.teams.data.some((t: any) => t.name === "Bulls")).toBe(true);
    });

    expect(
      await screen.findByText(/team created successfully!/i),
    ).toBeInTheDocument();
  });

  it("validates empty team name", async () => {
    const dialog = await openCreateDialog();

    const nextButton =
      within(dialog).queryByRole("button", { name: /^next$/i }) ||
      within(dialog).queryByRole("button", { name: /continue/i });

    expect(nextButton).toBeTruthy();
    fireEvent.click(nextButton as HTMLElement);

    expect(
      await screen.findByText(/team name is required/i),
    ).toBeInTheDocument();
  });

  it("closes the dialog when cancel is clicked", async () => {
    const dialog = await openCreateDialog();

    fireEvent.click(within(dialog).getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("navigates when a team card is clicked or keyboard activated", async () => {
    mockDb.seed({
      teams: [{ id: "t1", name: "Nav Team", primaryColor: "#154C56" }],
    });

    renderComponent();

    const card =
      (await screen
        .findByRole("button", {
          name: /view team dashboard for nav team/i,
        })
        .catch(() => null)) ||
      (await screen.findByLabelText(/view stats for nav team/i));

    fireEvent.keyDown(card, { key: "Enter", code: "Enter" });
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    fireEvent.keyDown(card, { key: " ", code: "Space" });
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");
  });

  it("shows an error message when adding a team fails", async () => {
    mockDb.teams.add.mockImplementationOnce(() => {
      throw new Error("Add failed");
    });

    const dialog = await openCreateDialog();

    await fillWorkflow(dialog, { name: "Fail Team" });

    const submitButton = getSubmitButton(dialog);
    expect(submitButton).toBeTruthy();
    fireEvent.click(submitButton as HTMLElement);

    expect(
      await screen.findByText(
        /failed to create team|unable to create team|something went wrong/i,
      ),
    ).toBeInTheDocument();
  });
});
