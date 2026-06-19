import { renderWithProviders as render, screen } from "../../test-utils";
import userEvent from "@testing-library/user-event";
import BasketballCourt from "./BasketballCourt";
import { describe, it, expect, vi } from "vitest";

describe("BasketballCourt Component", () => {
  it("renders SVG court", () => {
    const { container } = render(<BasketballCourt onCoordClick={vi.fn()} />);

    // Check for some SVG elements
    const svgElement = container.querySelector("svg");
    expect(svgElement).toBeInTheDocument();
    expect(container.querySelector("rect")).toBeInTheDocument();
    expect(container.querySelector("circle")).toBeInTheDocument();
  });

  it("calls onCoordClick when clicked", async () => {
    const user = userEvent.setup();
    const onCoordClick = vi.fn();
    render(<BasketballCourt onCoordClick={onCoordClick} />);

    const svg = document.querySelector("svg");
    if (!svg) throw new Error("SVG not found");

    // Mock getBoundingClientRect
    svg.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    });

    // We use pointer to simulate a click at specific coordinates
    await user.pointer([
      { target: svg, coords: { clientX: 50, clientY: 50 } },
      { keys: "[MouseLeft]" },
    ]);

    expect(onCoordClick).toHaveBeenCalledWith(50, 50);
  });

  it("renders heatmap zones", () => {
    const heatmapData = {
      "3PT_CENTER": { makes: 1, attempts: 2 },
      PAINT: { makes: 3, attempts: 5 },
      RA: { makes: 4, attempts: 4 },
      "3PT_LEFT": { makes: 1, attempts: 1 },
      "3PT_RIGHT": { makes: 1, attempts: 1 },
      "3PT_LEFT_CORNER": { makes: 1, attempts: 1 },
      "3PT_RIGHT_CORNER": { makes: 1, attempts: 1 },
      MID_LEFT: { makes: 1, attempts: 1 },
      MID_RIGHT: { makes: 1, attempts: 1 },
      MID_CENTER: { makes: 1, attempts: 1 },
    };
    const { container } = render(<BasketballCourt heatmapData={heatmapData} />);

    const heatmapGroup = container.querySelector("g[opacity='0.4']");
    expect(heatmapGroup).toBeInTheDocument();
    expect(heatmapGroup?.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(heatmapGroup?.querySelector("circle")).toBeInTheDocument();
  });

  it("renders markers and handles clicks", async () => {
    const user = userEvent.setup();
    const markers = [
      { id: 1, x: 10, y: 10, type: "MAKE", label: "24" },
      { id: 2, x: 20, y: 20, type: "MISS", playerName: "John Doe" },
      { id: 3, x: 30, y: 30, type: "REBOUND" },
      { id: 4, x: 40, y: 40, type: "STEAL" },
      { id: 5, x: 50, y: 50, type: "ASSIST" },
      { id: 6, x: 60, y: 60, type: "TURNOVER" },
    ];
    const onMarkerClick = vi.fn();
    render(<BasketballCourt markers={markers} onMarkerClick={onMarkerClick} />);

    expect(screen.getByText("24")).toBeInTheDocument();

    const markerButtons = screen.getAllByRole("button");
    await user.click(markerButtons[0]);
    expect(onMarkerClick).toHaveBeenCalledWith(markers[0]);
  });

  it("handles keyboard interaction on markers", async () => {
    const user = userEvent.setup();
    const markers = [{ id: "m1", x: 10, y: 10, type: "MAKE" }];
    const onMarkerClick = vi.fn();
    render(<BasketballCourt markers={markers} onMarkerClick={onMarkerClick} />);

    const markerButton = screen.getByRole("button");
    markerButton.focus();
    await user.keyboard("{Enter}");
    expect(onMarkerClick).toHaveBeenCalled();

    await user.keyboard(" ");
    expect(onMarkerClick).toHaveBeenCalledTimes(2);
  });

  it("renders markers with undefined x/y coordinates without crashing", () => {
    const markers = [
      {
        id: 1,
        x: undefined,
        y: undefined,
        type: "MAKE",
        playerName: "John Doe",
      },
      { id: 2, x: 10, y: undefined, type: "MISS" },
      { id: 3, x: undefined, y: 20, type: "REBOUND" },
    ] as unknown as Parameters<typeof BasketballCourt>[0]["markers"];
    expect(() => render(<BasketballCourt markers={markers} />)).not.toThrow();
  });
});
