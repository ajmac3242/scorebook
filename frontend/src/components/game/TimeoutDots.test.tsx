import React from "react";
import { renderWithProviders as render, screen, assertAccessible } from "../../test-utils";
import { describe, expect, it } from "vitest";
import TimeoutDots from "./TimeoutDots";

describe("TimeoutDots", () => {
  it("renders correct number of dots with default total of 5", async () => {
    const { container } = render(
      <TimeoutDots count={3} />,
      { withAuth: false }
    );

    // Default total is 5
    const activeDots = screen.getAllByTestId("timeout-dot-active");
    const inactiveDots = screen.getAllByTestId("timeout-dot-inactive");

    expect(activeDots).toHaveLength(3);
    expect(inactiveDots).toHaveLength(2);

    // Verify accessibility labeling
    const stack = screen.getByRole("img", { name: "3 timeouts remaining" });
    expect(stack).toBeInTheDocument();

    await assertAccessible(container);
  });

  it("respects custom total count", async () => {
    const { container } = render(
      <TimeoutDots count={1} total={3} color="red" />,
      { withAuth: false }
    );

    const activeDots = screen.getAllByTestId("timeout-dot-active");
    const inactiveDots = screen.getAllByTestId("timeout-dot-inactive");

    expect(activeDots).toHaveLength(1);
    expect(inactiveDots).toHaveLength(2);

    await assertAccessible(container);
  });

  it("handles boundary condition where count exceeds total", async () => {
    render(<TimeoutDots count={6} total={5} />, { withAuth: false });

    // If count > total, all dots (total=5) are active
    const activeDots = screen.getAllByTestId("timeout-dot-active");
    expect(activeDots).toHaveLength(5);
    expect(screen.queryAllByTestId("timeout-dot-inactive")).toHaveLength(0);
  });

  it("handles boundary condition where count is 0", async () => {
    render(<TimeoutDots count={0} total={4} />, { withAuth: false });

    // If count = 0, all dots are inactive
    const inactiveDots = screen.getAllByTestId("timeout-dot-inactive");
    expect(inactiveDots).toHaveLength(4);
    expect(screen.queryAllByTestId("timeout-dot-active")).toHaveLength(0);
  });
});
