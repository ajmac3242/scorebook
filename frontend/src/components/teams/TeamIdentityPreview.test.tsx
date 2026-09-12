import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders, assertAccessible } from "../../test-utils";
import TeamIdentityPreview from "./TeamIdentityPreview";

describe("TeamIdentityPreview", () => {
  const primaryColor = "rgb(25, 118, 210)";

  it("renders team name, description, and fallback avatar initials when no logo is provided", () => {
    const { container } = renderWithProviders(
      <TeamIdentityPreview
        teamName="Wildcats"
        description="Varsity Men Basketball"
        logoUrl=""
        primaryColor={primaryColor}
      />
    );

    expect(screen.getByText("Wildcats")).toBeInTheDocument();
    expect(screen.getByText("Varsity Men Basketball")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders default team name fallback when teamName is empty", () => {
    renderWithProviders(
      <TeamIdentityPreview
        teamName=""
        description=""
        logoUrl=""
        primaryColor={primaryColor}
      />
    );

    expect(screen.getByText("New team")).toBeInTheDocument();
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders avatar image when logoUrl is provided", () => {
    const logoUrl = "https://example.com/logo.png";
    const { container } = renderWithProviders(
      <TeamIdentityPreview
        teamName="Lions"
        description="JV Basketball"
        logoUrl={logoUrl}
        primaryColor={primaryColor}
      />
    );

    expect(screen.getByText("Lions")).toBeInTheDocument();
    expect(screen.getByText("JV Basketball")).toBeInTheDocument();
    const avatarImg = container.querySelector("img");
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute("src", logoUrl);
  });

  it("passes accessibility check", async () => {
    const { container } = renderWithProviders(
      <TeamIdentityPreview
        teamName="Eagles"
        description="Conference Champions"
        logoUrl=""
        primaryColor={primaryColor}
      />
    );

    await assertAccessible(container);
  });
});
