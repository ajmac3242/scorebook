import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SectionCard from "../components/layout/SectionCard";
import { CourtSightThemeProvider } from "../theme/ThemeContext";

describe("SectionCard Component", () => {
  it("renders title and children", () => {
    render(
      <CourtSightThemeProvider>
        <SectionCard title="Test Section">
          <div>Test Content</div>
        </SectionCard>
      </CourtSightThemeProvider>,
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("calls onExpand when expand button is clicked", () => {
    const onExpand = vi.fn();
    render(
      <CourtSightThemeProvider>
        <SectionCard title="Test Section" onExpand={onExpand}>
          <div>Test Content</div>
        </SectionCard>
      </CourtSightThemeProvider>,
    );

    const expandButton = screen.getByLabelText("Expand section");
    fireEvent.click(expandButton);
    expect(onExpand).toHaveBeenCalled();
  });
});
