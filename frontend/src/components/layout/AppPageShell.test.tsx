import { describe, expect, it, vi } from "vitest";
import {
  screen,
  renderWithProviders,
  assertAccessible,
} from "../../test-utils";
import userEvent from "@testing-library/user-event";
import AppPageShell from "./AppPageShell";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";

describe("AppPageShell", () => {
  it("renders children, title, breadcrumbs, tabs, and controls", async () => {
    const user = userEvent.setup();
    const handleTabChange = vi.fn();
    const handleControlClick = vi.fn();

    const { container } = renderWithProviders(
      <AppPageShell
        title="Game Analytics"
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Games", href: "/games" },
          { label: "Analytics" },
        ]}
        activeTab="overview"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "lineups", label: "Lineups" },
        ]}
        onTabChange={handleTabChange}
        controls={
          <Button variant="contained" onClick={handleControlClick}>
            Export PDF
          </Button>
        }
      >
        <div>Content Shell Body</div>
      </AppPageShell>,
    );

    expect(screen.getByText("Content Shell Body")).toBeInTheDocument();
    expect(screen.getByText("Game Analytics")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();

    const lineupsTab = screen.getByRole("tab", { name: "Lineups" });
    await user.click(lineupsTab);
    expect(handleTabChange).toHaveBeenCalledWith("lineups");

    const exportBtn = screen.getByRole("button", { name: "Export PDF" });
    await user.click(exportBtn);
    expect(handleControlClick).toHaveBeenCalled();

    await assertAccessible(container);
  });

  it("renders contextLabel when breadcrumb is not provided", async () => {
    const { container } = renderWithProviders(
      <AppPageShell title="Team Roster" contextLabel="Season 2026">
        <div>Roster Content</div>
      </AppPageShell>,
    );

    expect(screen.getByText("Team Roster")).toBeInTheDocument();
    expect(screen.getByText("Season 2026")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders headerContent with bleedHeader mode", async () => {
    const { container } = renderWithProviders(
      <AppPageShell
        headerContent={
          <div data-testid="custom-header">Custom Header Content</div>
        }
        bleedHeader={true}
      >
        <div>Main Content Area</div>
      </AppPageShell>,
    );

    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
    expect(screen.getByText("Main Content Area")).toBeInTheDocument();
    await assertAccessible(container);
  });

  it("renders FAB button on mobile viewports when fabProps is provided", async () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("max-width") || query.includes("down"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const handleFabClick = vi.fn();

    const { container } = renderWithProviders(
      <AppPageShell
        title="Roster"
        fabProps={{
          "aria-label": "Add Player",
          icon: <AddIcon />,
          onClick: handleFabClick,
        }}
      >
        <div>Roster Table</div>
      </AppPageShell>,
    );

    const fab = screen.getByRole("button", { name: "Add Player" });
    expect(fab).toBeInTheDocument();
    await assertAccessible(container);
  });
});
