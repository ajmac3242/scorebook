import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import EntityRowCard from "./EntityRowCard";

describe("EntityRowCard", () => {
  const defaultProps = {
    title: "Test Title",
    subtitle: "Test Subtitle",
    eyebrow: "Test Eyebrow",
    onClick: vi.fn(),
  };

  it("renders basic content correctly", () => {
    render(<EntityRowCard {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Test Eyebrow")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    render(<EntityRowCard {...defaultProps} />);

    await user.click(screen.getByRole("button"));
    expect(defaultProps.onClick).toHaveBeenCalled();
  });

  it("renders leading and trailing content", () => {
    render(
      <EntityRowCard
        {...defaultProps}
        leading={<div data-testid="leading">Leading</div>}
        trailing={<div data-testid="trailing">Trailing</div>}
      />,
    );
    expect(screen.getByTestId("leading")).toBeInTheDocument();
    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <EntityRowCard {...defaultProps} actions={<button>Action</button>} />,
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("renders badges and metrics", () => {
    render(
      <EntityRowCard
        {...defaultProps}
        badges={<span data-testid="badge">Badge</span>}
        metrics={<span data-testid="metric">Metric</span>}
      />,
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
    expect(screen.getByTestId("metric")).toBeInTheDocument();
  });

  it("renders metrics when badges is omitted", () => {
    render(
      <EntityRowCard
        title="No Badges Card"
        metrics={<span data-testid="only-metric">Only Metric</span>}
      />,
    );
    expect(screen.getByTestId("only-metric")).toBeInTheDocument();
  });

  it("renders non-clickable card when onClick is not provided", () => {
    render(<EntityRowCard title="Non Clickable Card" subtitle="Static Subtitle" />);
    expect(screen.getByText("Non Clickable Card")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("handles keyboard events and custom accentColor when clickable", async () => {
    const user = userEvent.setup();
    const handleKeyDown = vi.fn();
    const customAccent = "rgb(255, 0, 0)";
    render(
      <EntityRowCard
        {...defaultProps}
        onKeyDown={handleKeyDown}
        accentColor={customAccent}
        ariaLabel="Custom Accessible Label"
      />,
    );

    const button = screen.getByRole("button", { name: "Custom Accessible Label" });
    await user.type(button, "{enter}");
    expect(handleKeyDown).toHaveBeenCalled();
  });

  it("passes accessibility checks", async () => {
    const { container } = render(
      <EntityRowCard
        {...defaultProps}
        leading={<span data-testid="lead">Icon</span>}
        trailing={<span data-testid="trail">Arrow</span>}
        badges={<span>Status</span>}
        metrics={<span>10 PTS</span>}
      />,
    );
    await assertAccessible(container);
  });
});
