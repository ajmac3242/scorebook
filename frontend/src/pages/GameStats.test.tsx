import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  renderWithProviders as render,
  screen,
  waitFor,
  act,
  cleanup,
  assertAccessible,
} from "../test-utils";
import GameStats from "./GameStats";
import { mockDb } from "../dbMock";
import { buildTeam, buildGame, buildGameEvent } from "../test-factories";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    // Use the actual useSearchParams if possible, but MemoryRouter handles it
  };
});

// Mock Recharts to avoid ResizeObserver errors and complexity
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...(actual as any),
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: ({ children }: any) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    ReferenceLine: () => <div />,
    BarChart: ({ children }: any) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: () => <div />,
    Cell: () => <div />,
    AreaChart: ({ children }: any) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Area: () => <div />,
  };
});

// Mock html2canvas and jsPDF to avoid hanging
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue(document.createElement("canvas")),
}));
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockReturnValue({
    addImage: vi.fn(),
    save: vi.fn(),
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
  }),
}));

describe("GameStats Page", () => {
  const mockGameId = "game-123";
  const mockTeamId = "team-456";

  beforeEach(async () => {
    mockDb.reset();
    vi.clearAllMocks();
    (window as any).isTesting = true;

    await mockDb.seed({
      games: [
        buildGame({
          id: mockGameId,
          teamId: mockTeamId,
          opponent: "Rivals",
          date: "2023-01-01",
          completed: 1,
        }),
      ],
      teams: [
        buildTeam({
          id: mockTeamId,
          name: "Our Team",
        }),
      ],
      stats: [
        buildGameEvent({
          gameId: mockGameId,
          type: "MADE_2",
          points: 2,
          teamId: mockTeamId,
          period: 1,
          clock: "10:00",
        }),
        buildGameEvent({
          gameId: mockGameId,
          type: "MISSED_2",
          points: 0,
          teamId: "OPPONENT",
          period: 1,
          clock: "09:30",
        }),
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (gameId = mockGameId) =>
    render(<GameStats />, { route: "/stats?gameId=" + gameId });

  it("renders basic metrics and information", async () => {
    renderComponent();
    await screen.findByText(/vs Rivals/i);
    expect(screen.getByText("TOTAL STOPS")).toBeInTheDocument();
    expect(screen.getByText("KILLS (3x STOPS)")).toBeInTheDocument();
    expect(screen.getByText("Our Team")).toBeInTheDocument();
  });

  it("switches tabs between Standard and Impact", async () => {
    const user = userEvent.setup();
    renderComponent();
    await screen.findByText(/Standard/i);

    const impactTab = screen.getByRole("button", { name: /Impact/i });
    await user.click(impactTab);

    expect(
      await screen.findByText(/Team Impact Analytics/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Matchup Accountability/i)).toBeInTheDocument();

    const standardTab = screen.getByRole("button", { name: /Standard/i });
    await user.click(standardTab);
    await waitFor(() => {
      expect(
        screen.queryByText(/Team Impact Analytics/i),
      ).not.toBeInTheDocument();
    });
  });

  it("handles deleted game state correctly", async () => {
    await mockDb.games.update(mockGameId, {
      deletedAt: new Date().toISOString(),
    });

    renderComponent();

    expect(await screen.findByText(/Read Only Mode/i)).toBeInTheDocument();
    expect(screen.getByText(/Restore Game/i)).toBeInTheDocument();

    const restoreBtn = screen.getByText(/Restore Game/i);
    await userEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Read Only Mode/i)).not.toBeInTheDocument();
    });
  });

  it("toggles CLUTCH MODE", async () => {
    const user = userEvent.setup();
    renderComponent();

    const clutchToggle = await screen.findByText(/CLUTCH MODE/i);

    await user.click(clutchToggle);
    // Instead of checking exact color which is brittle, we check the selected state if available or just wait for it to not crash
    // ToggleButton usually sets aria-pressed
    expect(clutchToggle).toHaveAttribute("aria-pressed", "true");

    await user.click(clutchToggle);
    expect(clutchToggle).toHaveAttribute("aria-pressed", "false");
  });

  it("opens and interacts with Defensive Integrity dialog", async () => {
    const user = userEvent.setup();
    renderComponent();

    const integrityBtn = await screen.findByRole("button", {
      name: /View Report/i,
    });
    await user.click(integrityBtn);

    expect(
      await screen.findByText("Defensive Integrity Report"),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /Close/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(
        screen.queryByText("Defensive Integrity Report"),
      ).not.toBeInTheDocument();
    });
  });

  it("opens Practice Prescription dialog", async () => {
    const user = userEvent.setup();
    renderComponent();

    const practiceBtn = await screen.findByRole("button", {
      name: /Practice Planner/i,
    });
    await user.click(practiceBtn);

    expect(
      await screen.findByText("Practice Prescription Engine"),
    ).toBeInTheDocument();
  });

  it("opens and handles Edit Game dialog", async () => {
    const user = userEvent.setup();
    renderComponent();

    const editBtn = await screen.findByTestId("EditIcon");
    await user.click(editBtn.parentElement!);

    expect(await screen.findByText("Edit Game Details")).toBeInTheDocument();

    const opponentInput = screen.getByLabelText(/Opponent/i);
    await user.clear(opponentInput);
    await user.type(opponentInput, "New Rivals");

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByText("Edit Game Details")).not.toBeInTheDocument();
    });
    expect(await screen.findByText(/vs New Rivals/i)).toBeInTheDocument();
  });

  it("expands sections into dialogs", async () => {
    const user = userEvent.setup();
    renderComponent();

    // Box Score
    const boxScoreExpand = (
      await screen.findAllByLabelText(/Expand section/i)
    )[0];
    await user.click(boxScoreExpand);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Box Score/i).length).toBeGreaterThan(1);

    const closeBtn = screen.getByRole("button", { name: /Close/i });
    await user.click(closeBtn);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // Shot Chart
    const shotChartExpand = (
      await screen.findAllByLabelText(/Expand section/i)
    )[1];
    await user.click(shotChartExpand);
    expect(await screen.findByText("Shot Chart")).toBeInTheDocument();
    const closeBtn2 = screen.getByRole("button", { name: /Close/i });
    await user.click(closeBtn2);

    // Score Flow
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const scoreFlowExpand = (
      await screen.findAllByLabelText(/Expand section/i)
    )[2];
    await user.click(scoreFlowExpand);
    expect(await screen.findByText("Score Flow")).toBeInTheDocument();
    const closeBtn3 = screen.getByRole("button", { name: /Close/i });
    await user.click(closeBtn3);

    // Lineups
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    const lineupExpand = (
      await screen.findAllByLabelText(/Expand section/i)
    )[3];
    await user.click(lineupExpand);
    expect(await screen.findByText("Lineup Efficiency")).toBeInTheDocument();
  });

  it("handles PDF export", async () => {
    const user = userEvent.setup();
    renderComponent();

    const exportBtn = await screen.findByRole("button", {
      name: /Export PDF/i,
    });
    await user.click(exportBtn);

    // It should show "Exporting..."
    await waitFor(() => {
      expect(screen.getByText(/Exporting\.\.\./i)).toBeInTheDocument();
    });

    // After async mock completes (it's immediate in mock usually, but we'll wait)
    await waitFor(
      () => {
        expect(screen.getByText(/Export PDF/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("handles game deletion and confirm dialog", async () => {
    const user = userEvent.setup();
    renderComponent();

    const editBtn = await screen.findByTestId("EditIcon");
    await user.click(editBtn.parentElement!);

    const deleteBtn = await screen.findByRole("button", {
      name: /Delete Game/i,
    });
    await user.click(deleteBtn);

    expect(await screen.findByText(/Delete Game\?/i)).toBeInTheDocument();

    const confirmDelete = screen.getByRole("button", { name: /Yes, Delete/i });
    await user.click(confirmDelete);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = renderComponent();
    await screen.findByText(/vs Rivals/i);
    await assertAccessible(container, {
      rules: {
        "heading-order": { enabled: false },
        "nested-interactive": { enabled: false },
      },
    });
  });
});
