import { describe, it, expect } from "vitest";
import { renderWithProviders as render, screen } from "../../test-utils";
import SyncBadge from "./SyncBadge";

describe("SyncBadge", () => {
  it("renders offline state by default", () => {
    render(<SyncBadge />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Offline mode",
    );
  });

  it("renders live state when isLive is true", () => {
    render(<SyncBadge isLive={true} />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Live synchronization active",
    );
  });
});
