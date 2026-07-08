import { describe, it, expect } from "vitest";
import {
  renderWithProviders as render,
  screen,
  assertAccessible,
} from "../test-utils";
import Reports from "./Reports";

describe("Reports Page Placeholder", () => {
  it("renders the placeholder text", async () => {
    const { container } = render(<Reports />);
    await assertAccessible(container);
    expect(
      screen.getByText(/View season and game reports here/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Placeholder for DESIGN-003-B/i),
    ).toBeInTheDocument();
  });
});
