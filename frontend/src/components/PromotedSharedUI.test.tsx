import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders as render, screen } from "../test-utils";
import { SurfaceCard } from "./cards/SurfaceCard";

// Mock useNavigate - though not used by SurfaceCard anymore
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Promoted Shared Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SurfaceCard", () => {
    it("renders children correctly", () => {
      render(<SurfaceCard>Test Content</SurfaceCard>);
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("applies custom sx props", () => {
      const { container } = render(
        <SurfaceCard sx={{ marginTop: "10px" }}>Content</SurfaceCard>,
      );
      expect(container.firstChild).toHaveStyle("margin-top: 10px");
    });
  });
});
