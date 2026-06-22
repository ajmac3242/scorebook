import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import PageSectionIntro from "./PageSectionIntro";
import React from "react";

describe("PageSectionIntro", () => {
  it("renders with title", () => {
    render(<PageSectionIntro title="Section Title" />);
    expect(screen.getByText("Section Title")).toBeInTheDocument();
  });

  it("renders with description", () => {
    render(<PageSectionIntro title="Section Title" description="Section Description" />);
    expect(screen.getByText("Section Description")).toBeInTheDocument();
  });
});
