import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../test-utils";
import Games from "./Games";

describe("Games Page Placeholder", () => {
  it("renders the placeholder text", async () => {
    const { container } = render(<Games />);
    await assertAccessible(container);
    expect(
      screen.getByText(/Manage and track your games here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Placeholder for DESIGN-003-B/i),
    ).toBeInTheDocument();
  });
});
