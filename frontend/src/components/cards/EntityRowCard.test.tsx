import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen, act } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import EntityRowCard from "./EntityRowCard";
import { Box } from "@mui/material";

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

  it("handles keyboard interaction", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(<EntityRowCard {...defaultProps} onKeyDown={onKeyDown} />);

    const button = screen.getByRole("button");
    button.focus();
    await act(async () => {
      await user.keyboard("{Enter}");
    });
    expect(onKeyDown).toHaveBeenCalled();
  });

  it("renders as a div when not clickable", () => {
    render(<EntityRowCard {...defaultProps} onClick={undefined} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("applies accent color on hover", () => {
    render(<EntityRowCard {...defaultProps} accentColor="var(--cs-semantic-color-brand-primary-main)" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders with custom aria-label", () => {
    render(<EntityRowCard {...defaultProps} ariaLabel="Custom Label" />);
    expect(screen.getByLabelText("Custom Label")).toBeInTheDocument();
  });

  it("renders badges without metrics", () => {
    render(<EntityRowCard {...defaultProps} badges={<Box data-testid="only-badge" />} />);
    expect(screen.getByTestId("only-badge")).toBeInTheDocument();
  });

  it("renders metrics without badges", () => {
    render(<EntityRowCard {...defaultProps} metrics={<Box data-testid="only-metric" />} />);
    expect(screen.getByTestId("only-metric")).toBeInTheDocument();
  });
});
