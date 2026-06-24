import { describe, it, expect, vi } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import SectionCard from "./SectionCard";

describe("SectionCard", () => {
  it("renders title and children", () => {
    render(
      <SectionCard title="Test Section">
        <div>Child Content</div>
      </SectionCard>,
    );
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders actions when provided", () => {
    render(
      <SectionCard title="Test Section" actions={<button>Action</button>}>
        <div>Content</div>
      </SectionCard>,
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("calls onExpand when expand button is clicked", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <SectionCard title="Test Section" onExpand={onExpand}>
        <div>Content</div>
      </SectionCard>,
    );

    await user.click(screen.getByRole("button", { name: /expand section/i }));
    expect(onExpand).toHaveBeenCalled();
  });
});
