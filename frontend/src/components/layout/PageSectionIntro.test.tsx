import React from "react";
import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../../test-utils";
import PageSectionIntro from "./PageSectionIntro";

describe("PageSectionIntro Component", () => {
  it("renders title and description correctly", () => {
    render(
      <PageSectionIntro
        title="Team Roster"
        description="Manage active players and jersey assignments"
      />,
    );

    expect(screen.getByText("Team Roster")).toBeInTheDocument();
    expect(
      screen.getByText("Manage active players and jersey assignments"),
    ).toBeInTheDocument();
  });

  it("renders title without description when description is omitted", () => {
    render(<PageSectionIntro title="Analytics Overview" />);

    expect(screen.getByText("Analytics Overview")).toBeInTheDocument();
  });

  it("passes accessibility assertions", async () => {
    const { container } = render(
      <PageSectionIntro
        title="Accessible Section"
        description="Accessibility verification"
      />,
    );

    await assertAccessible(container);
  });
});
