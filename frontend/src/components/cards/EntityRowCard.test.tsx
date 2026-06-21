import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
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
});
