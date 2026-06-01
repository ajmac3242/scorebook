import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PageBreadcrumb from "./PageBreadcrumb";
import { describe, it, expect } from "vitest";

describe("PageBreadcrumb", () => {
  it("renders multiple segments with separators", () => {
    const segments = [
      { label: "Home", to: "/" },
      { label: "Teams", to: "/teams" },
      { label: "Lakers" },
    ];

    render(
      <BrowserRouter>
        <PageBreadcrumb segments={segments} />
      </BrowserRouter>
    );

    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Teams")).toBeDefined();
    expect(screen.getByText("Lakers")).toBeDefined();
    expect(screen.getAllByText("/")).toHaveLength(2);
  });

  it("renders the last segment as plain text", () => {
    const segments = [{ label: "Current Page" }];

    render(
      <BrowserRouter>
        <PageBreadcrumb segments={segments} />
      </BrowserRouter>
    );

    const currentPage = screen.getByText("Current Page");
    expect(currentPage.tagName).not.toBe("A");
  });

  it("renders parent segments as links if 'to' is provided", () => {
    const segments = [
      { label: "Teams", to: "/teams" },
      { label: "Pacers" },
    ];

    render(
      <BrowserRouter>
        <PageBreadcrumb segments={segments} />
      </BrowserRouter>
    );

    const teamsLink = screen.getByRole("link", { name: "Teams" });
    expect(teamsLink.getAttribute("href")).toBe("/teams");
  });
});
