import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";

describe("Dashboard Component", () => {
  it("renders Dashboard page", () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Notebook Overview/i)).toBeInTheDocument();
  });
});
