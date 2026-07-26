import React from "react";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../test-utils";
import { describe, expect, it } from "vitest";
import CourtSightLogo from "./CourtSightLogo";

describe("CourtSightLogo", () => {
  it("renders the full logo with default props", async () => {
    const { container } = render(<CourtSightLogo />, { withAuth: false });

    // Should find role="img" with name "CourtSight"
    const logoImg = screen.getByRole("img", { name: "CourtSight" });
    expect(logoImg).toBeInTheDocument();
    expect(screen.getByText("Court")).toBeInTheDocument();
    expect(screen.getByText("Sight")).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("renders only the mark icon when markOnly is true", async () => {
    const { container } = render(<CourtSightLogo markOnly={true} />, {
      withAuth: false,
    });

    // Should find role="img" with name "CourtSight mark"
    const markImg = screen.getByRole("img", { name: "CourtSight mark" });
    expect(markImg).toBeInTheDocument();

    // Text "Court" or "Sight" should not be visible
    expect(screen.queryByText("Court")).not.toBeInTheDocument();
    expect(screen.queryByText("Sight")).not.toBeInTheDocument();

    await assertAccessible(container);
  });

  it("respects custom width prop and adjusts text and icon sizes accordingly", async () => {
    render(<CourtSightLogo width={200} />, { withAuth: false });
    const logoImg = screen.getByRole("img", { name: "CourtSight" });
    expect(logoImg).toBeInTheDocument();
  });
});
