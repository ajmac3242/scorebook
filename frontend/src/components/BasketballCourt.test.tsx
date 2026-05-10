import { render, fireEvent, screen } from "@testing-library/react";
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

  it("calls onCoordClick when clicked", () => {
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

    fireEvent.click(svg, { clientX: 50, clientY: 50 });

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

  it("renders markers and handles clicks", () => {
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
    fireEvent.click(markerButtons[0]);
    expect(onMarkerClick).toHaveBeenCalledWith(markers[0]);
  });

  it("handles keyboard interaction on markers", () => {
    const markers = [{ id: "m1", x: 10, y: 10, type: "MAKE" }];
    const onMarkerClick = vi.fn();
    render(<BasketballCourt markers={markers} onMarkerClick={onMarkerClick} />);

    const markerButton = screen.getByRole("button");
    fireEvent.keyDown(markerButton, { key: "Enter" });
    expect(onMarkerClick).toHaveBeenCalled();

    fireEvent.keyDown(markerButton, { key: " " });
    expect(onMarkerClick).toHaveBeenCalledTimes(2);
  });
});
