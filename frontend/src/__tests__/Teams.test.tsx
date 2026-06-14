import {
  cleanup,
  renderWithProviders as render,
  screen,
  waitFor,
  within,
} from "../test-utils";
import userEvent from "@testing-library/user-event";
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

  const renderComponent = () => render(<Teams />);

  const getCreateTeamButton = () => {
    return (
      screen.queryByRole("button", { name: /add team/i }) ||
      screen.queryByRole("button", { name: /create first team/i }) ||
      screen.queryByRole("button", { name: /create team now/i }) ||
      screen.queryByRole("button", { name: /create team/i })
    );
  };

  const openCreateDialog = async () => {
    const user = userEvent.setup();
    renderComponent();

    const trigger = getCreateTeamButton();
    expect(trigger).toBeTruthy();

    await user.click(trigger as HTMLElement);

    return await screen.findByRole("dialog");
  };

  const clickNext = async (dialog: HTMLElement) => {
    const user = userEvent.setup();
    const nextButton =
      within(dialog).queryByRole("button", { name: /^next$/i }) ||
      within(dialog).queryByRole("button", { name: /continue/i }) ||
      within(dialog).queryByRole("button", { name: /review/i });

    expect(nextButton).toBeTruthy();
    await user.click(nextButton as HTMLElement);
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
    const user = userEvent.setup();
    await user.type(
      within(dialog).getByLabelText(/team name/i),
      overrides?.name ?? "Bulls",
    );

    if (overrides?.description !== undefined) {
      const descriptionField =
        within(dialog).queryByLabelText(/description/i) ||
        within(dialog).queryByLabelText(/team description/i);

      if (descriptionField) {
        await user.type(descriptionField, overrides.description);
      }
    }

    await clickNext(dialog);

    if (overrides?.logoUrl !== undefined) {
      const user = userEvent.setup();
      const logoUrlField =
        within(dialog).queryByLabelText(/logo url/i) ||
        within(dialog).queryByLabelText(/logo/i);

      if (logoUrlField) {
        await user.type(logoUrlField, overrides.logoUrl);
      }
    }

    await clickNext(dialog);

    // fouls are now configured via StepperField (button controls), not a text input.
    // The workflow ships with sensible defaults so we skip foul field interaction here.

    const periodSelect = within(dialog).queryByRole("combobox", {
      name: /period structure/i,
    });

    if (periodSelect) {
      const user = userEvent.setup();
      await user.click(periodSelect);

      const halvesOption = await screen.findByRole("option", {
        name: /halves/i,
      });
      await user.click(halvesOption);
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
    const user = userEvent.setup();
    mockDb.seed({
      teams: [
        { id: "t1", name: "Team One", isFavorite: 0, primaryColor: "#154C56" },
        { id: "t2", name: "Team Two", isFavorite: 1, primaryColor: "#000000" },
      ],
    });

    renderComponent();

    const favoriteButton = await screen.findByLabelText(
      /set team one as your default team/i,
    );
    await user.click(favoriteButton);

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      const t2 = mockDb.teams.data.find((t: any) => t.id === "t2");
      expect(t1?.isFavorite).toBe(1);
      expect(t2?.isFavorite).toBe(0);
    });

    await user.click(screen.getByLabelText(/team one is your default team/i));

    await waitFor(() => {
      const t1 = mockDb.teams.data.find((t: any) => t.id === "t1");
      expect(t1?.isFavorite).toBe(0);
    });
  });

  it("filters teams by search term and clears search from the empty state", async () => {
    const user = userEvent.setup();
    mockDb.seed({
      teams: [{ id: "t1", name: "Lakers", primaryColor: "#154C56" }],
    });

    renderComponent();

    const searchInput = getSearchInput();
    expect(searchInput).toBeTruthy();

    await user.type(searchInput as HTMLElement, "NonExistent");

    expect(
      await screen.findByText(/No results for "NonExistent"/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /clear search/i })[0],
    );

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

    const user = userEvent.setup();
    const submitButton = getSubmitButton(dialog);
    expect(submitButton).toBeTruthy();
    await user.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockDb.teams.data.some((t: any) => t.name === "Bulls")).toBe(true);
    });

    expect(
      await screen.findByText(/team created successfully!/i),
    ).toBeInTheDocument();
  });

  it("validates empty team name", async () => {
    const user = userEvent.setup();
    const dialog = await openCreateDialog();

    const nextButton =
      within(dialog).queryByRole("button", { name: /^next$/i }) ||
      within(dialog).queryByRole("button", { name: /continue/i });

    expect(nextButton).toBeTruthy();
    await user.click(nextButton as HTMLElement);

    expect(
      await screen.findByText(/team name is required/i),
    ).toBeInTheDocument();
  });

  it("closes the dialog when cancel is clicked", async () => {
    const user = userEvent.setup();
    const dialog = await openCreateDialog();

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("navigates when a team card is clicked or keyboard activated", async () => {
    const user = userEvent.setup();
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

    card.focus();
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    card.focus();
    await user.keyboard(" ");
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");

    await user.click(card);
    expect(mockNavigate).toHaveBeenCalledWith("/teams/t1");
  });

  it("shows an error message when adding a team fails", async () => {
    const user = userEvent.setup();
    mockDb.teams.add.mockImplementationOnce(() => {
      throw new Error("Add failed");
    });

    const dialog = await openCreateDialog();

    await fillWorkflow(dialog, { name: "Fail Team" });

    const submitButton = getSubmitButton(dialog);
    expect(submitButton).toBeTruthy();
    await user.click(submitButton as HTMLElement);

    expect(
      await screen.findByText(
        /failed to create team|unable to create team|something went wrong/i,
      ),
    ).toBeInTheDocument();
  });
});
