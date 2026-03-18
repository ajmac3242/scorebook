import { render, screen } from "@testing-library/react";
import Players from "./Players";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";

// Mock Dexie
vi.mock("../db", () => ({
  db: {
    open: vi.fn().mockResolvedValue(null),
    players: {
      toArray: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue(1),
    },
  },
}));

describe("Players Component", () => {
  it("renders Players page", () => {
    render(
      <BrowserRouter>
        <Players />
      </BrowserRouter>,
    );

    // Use a more specific query since "Players" appears in the empty state message too
    expect(
      screen.getByRole("heading", { name: /Players/i }),
    ).toBeInTheDocument();
  });
});
