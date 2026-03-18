import { render, screen } from "@testing-library/react";
import Seasons from "./Seasons";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

// Mock Dexie
vi.mock("../db", () => ({
  db: {
    open: vi.fn().mockResolvedValue(null),
    seasons: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

describe("Seasons Component", () => {
  it("renders Seasons page", () => {
    render(
      <BrowserRouter>
        <Seasons />
      </BrowserRouter>,
    );

    // Use a more specific query since "Seasons" appears in the empty state message too
    expect(
      screen.getByRole("heading", { name: /Seasons/i }),
    ).toBeInTheDocument();
  });
});
