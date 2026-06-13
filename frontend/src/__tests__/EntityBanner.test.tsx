import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../test-utils";
import EntityBanner from "../components/EntityBanner";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...(actual as any),
    useNavigate: () => mockNavigate,
  };
});

describe("EntityBanner", () => {
  it("renders basic title and subtitle", () => {
    render(<EntityBanner title="Test Team" subtitle="Test Subtitle" />);
    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
  });

  it("renders initials when no avatar or icon is provided", () => {
    render(<EntityBanner title="Golden State" />);
    expect(screen.getByText("GS")).toBeInTheDocument();
  });

  it("renders jersey number when provided", () => {
    render(<EntityBanner title="Player" jerseyNumber="30" />);
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("handles back button click", async () => {
    const { user } = render(<EntityBanner title="Test" backTo="/teams" />);
    await user.click(screen.getByLabelText(/Back to teams/i));
    expect(mockNavigate).toHaveBeenCalledWith("/teams");
  });

  it("renders stats correctly", () => {
    const stats = [
      { label: "PPG", value: "25.5" },
      { label: "RPG", value: 10 },
    ];
    render(<EntityBanner title="Test" stats={stats} />);
    expect(screen.getByText("PPG")).toBeInTheDocument();
    expect(screen.getByText("25.5")).toBeInTheDocument();
    expect(screen.getByText("RPG")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("handles search expansion and input", async () => {
    let searchTerm = "";
    const onSearchChange = vi.fn((val) => {
      searchTerm = val;
    });

    const { user, rerender } = render(
      <EntityBanner
        title="Test"
        onSearchChange={onSearchChange}
        searchTerm={searchTerm}
      />,
    );

    const searchButton = screen.getByLabelText("search");
    await user.click(searchButton);

    const searchField = screen.getByPlaceholderText(/Search.../i);

    // user.type is more realistic: it triggers multiple events.
    // However, the component expects the parent to manage the state and pass it back via searchTerm prop.
    for (const char of "query") {
      await user.type(searchField, char);
      rerender(
        <EntityBanner
          title="Test"
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />,
      );
    }

    expect(onSearchChange).toHaveBeenLastCalledWith("query");

    // Close search
    await user.click(screen.getByLabelText("close search"));
    expect(screen.queryByPlaceholderText(/Search.../i)).not.toBeInTheDocument();
  });

  it("handles sync click", async () => {
    const onSync = vi.fn();
    const { user } = render(<EntityBanner title="Test" onSync={onSync} />);

    const syncButton = screen.getByRole("button", { name: /Sync/i });
    await user.click(syncButton);
    expect(onSync).toHaveBeenCalled();
    expect(screen.getByText("Synced")).toBeInTheDocument();
  });
});
