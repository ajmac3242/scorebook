import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import {
  TokenPageShell,
  TokenSectionCard,
  TokenPageTitle,
  TokenSectionTitle,
} from "./TokenLayout";
import React from "react";

describe("TokenLayout", () => {
  it("renders TokenPageShell with children", () => {
    render(<TokenPageShell>Test Shell</TokenPageShell>);
    expect(screen.getByText("Test Shell")).toBeInTheDocument();
  });

  it("renders TokenSectionCard with children", () => {
    render(<TokenSectionCard>Test Card</TokenSectionCard>);
    expect(screen.getByText("Test Card")).toBeInTheDocument();
  });

  it("renders TokenPageTitle with text", () => {
    render(<TokenPageTitle>Page Title</TokenPageTitle>);
    expect(screen.getByText("Page Title")).toBeInTheDocument();
  });

  it("renders TokenSectionTitle with text", () => {
    render(<TokenSectionTitle>Section Title</TokenSectionTitle>);
    expect(screen.getByText("Section Title")).toBeInTheDocument();
  });
});
