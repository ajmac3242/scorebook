import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../test-utils";
import userEvent from "@testing-library/user-event";
import SectionCard from "../components/layout/SectionCard";

describe("SectionCard Component", () => {
  it("renders title and children", () => {
    render(
      <SectionCard title="Test Section">
        <div>Test Content</div>
      </SectionCard>,
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("calls onExpand when expand button is clicked", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <SectionCard title="Test Section" onExpand={onExpand}>
        <div>Test Content</div>
      </SectionCard>,
    );

    const expandButton = screen.getByLabelText("Expand section");
    await user.click(expandButton);
    expect(onExpand).toHaveBeenCalled();
  });
});
