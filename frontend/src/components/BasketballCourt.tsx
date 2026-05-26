import React from "react";
import { Box } from "@mui/material";

import { getHeatmapColor } from "../utils/shotZones";

interface Marker {
  id?: string | number;
  x: number;
  y: number;
  type: string;
  label?: string;
  color?: string;
  playerId?: string | number;
  playerName?: string;
}

interface HeatmapData {
  [key: string]: { makes: number; attempts: number };
}

const getCourtStyles = () => `
  @keyframes marker-appear {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  .court-marker {
    animation: marker-appear 0.3s ease-out forwards;
    transform-origin: center;
    transform-box: fill-box;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .court-marker:hover {
    transform: scale(1.5);
    opacity: 1 !important;
  }
  g[role="button"]:focus-visible circle {
    outline: var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing);
    outline-offset: var(--cs-semantic-focus-offset);
    transform: scale(1.5);
    opacity: 1 !important;
  }
  .latest-marker {
    animation: marker-appear 0.3s ease-out forwards, pulse 2s infinite 0.3s;
    opacity: 1 !important;
    cursor: pointer;
  }
  .court-svg:focus-visible {
    outline: var(--cs-semantic-focus-width) solid var(--cs-semantic-color-action-focusRing) !important;
    outline-offset: var(--cs-semantic-focus-offset);
  }
  @keyframes pulse {
    0% { r: 6; stroke-width: 1; }
    50% { r: 8; stroke-width: 3; }
    100% { r: 6; stroke-width: 1; }
  }
`;

/**
 * BasketballCourt component.
 * Displays an interactive court with shot markers.
 * Optimized with React.memo to prevent redundant re-renders.
 */
interface BasketballCourtProps {
  onCoordClick?: (_x: number, _y: number) => void;
  onMarkerClick?: (_marker: Marker) => void;
  markers?: Marker[];
  heatmapData?: HeatmapData;
}

const BasketballCourt: React.FC<BasketballCourtProps> = React.memo(
  ({ onCoordClick, onMarkerClick, markers = [], heatmapData }) => {
    const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
      // Only trigger if we clicked the background or court lines, not a marker
      if ((e.target as SVGElement).tagName !== "circle" && onCoordClick) {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onCoordClick(x, y);
      }
    };

    const courtLineColor = "var(--cs-semantic-color-border-strong)";
    const strokeWidth = 2;

    return (
      <Box
        data-testid="basketball-court"
        sx={{
          width: "100%",
          aspectRatio: "50 / 47",
          position: "relative",
          bgcolor: "var(--cs-semantic-color-surface-moleskine)",
          borderRadius: "var(--cs-semantic-shape-radius-md)",
          border: "1px solid var(--cs-semantic-color-border-subtle)",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 500 470"
          role="img"
          aria-label="Interactive basketball court map. Tap or use keyboard to record shot locations."
          onClick={handleCourtClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (onCoordClick) onCoordClick(50, 50); // Default to center for keyboard
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            cursor: onCoordClick ? "crosshair" : "default",
            outline: "none",
          }}
          className="court-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Out of bounds / Court Perimeter */}
          <rect
            x="0"
            y="0"
            width="500"
            height="470"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />

          {/* Heatmap Zones Overlay */}
          {heatmapData && (
            <g opacity="0.4" style={{ pointerEvents: "none" }}>
              {/* 3PT ABOVE THE BREAK */}
              {heatmapData["3PT_CENTER"]?.attempts > 0 && (
                <path
                  d="M 100 295 A 220 220 0 0 0 400 295 L 400 470 L 100 470 Z"
                  fill={getHeatmapColor(
                    (heatmapData["3PT_CENTER"].makes /
                      heatmapData["3PT_CENTER"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["3PT_LEFT"]?.attempts > 0 && (
                <path
                  d="M 0 140 L 30 140 A 220 220 0 0 0 100 295 L 0 470 Z"
                  fill={getHeatmapColor(
                    (heatmapData["3PT_LEFT"].makes /
                      heatmapData["3PT_LEFT"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["3PT_RIGHT"]?.attempts > 0 && (
                <path
                  d="M 500 140 L 470 140 A 220 220 0 0 1 400 295 L 500 470 Z"
                  fill={getHeatmapColor(
                    (heatmapData["3PT_RIGHT"].makes /
                      heatmapData["3PT_RIGHT"].attempts) *
                      100,
                  )}
                />
              )}

              {/* CORNER 3s */}
              {heatmapData["3PT_LEFT_CORNER"]?.attempts > 0 && (
                <rect
                  x="0"
                  y="0"
                  width="30"
                  height="140"
                  fill={getHeatmapColor(
                    (heatmapData["3PT_LEFT_CORNER"].makes /
                      heatmapData["3PT_LEFT_CORNER"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["3PT_RIGHT_CORNER"]?.attempts > 0 && (
                <rect
                  x="470"
                  y="0"
                  width="30"
                  height="140"
                  fill={getHeatmapColor(
                    (heatmapData["3PT_RIGHT_CORNER"].makes /
                      heatmapData["3PT_RIGHT_CORNER"].attempts) *
                      100,
                  )}
                />
              )}

              {/* MID RANGE */}
              {heatmapData["MID_LEFT"]?.attempts > 0 && (
                <path
                  d="M 30 0 L 170 0 L 170 190 L 86 190 A 220 220 0 0 1 30 140 Z"
                  fill={getHeatmapColor(
                    (heatmapData["MID_LEFT"].makes /
                      heatmapData["MID_LEFT"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["MID_RIGHT"]?.attempts > 0 && (
                <path
                  d="M 330 0 L 470 0 L 470 140 A 220 220 0 0 0 414 190 L 330 190 Z"
                  fill={getHeatmapColor(
                    (heatmapData["MID_RIGHT"].makes /
                      heatmapData["MID_RIGHT"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["MID_CENTER"]?.attempts > 0 && (
                <rect
                  x="170"
                  y="190"
                  width="160"
                  height="100"
                  fill={getHeatmapColor(
                    (heatmapData["MID_CENTER"].makes /
                      heatmapData["MID_CENTER"].attempts) *
                      100,
                  )}
                />
              )}

              {/* PAINT & RA */}
              {heatmapData["PAINT"]?.attempts > 0 && (
                <rect
                  x="170"
                  y="0"
                  width="160"
                  height="190"
                  fill={getHeatmapColor(
                    (heatmapData["PAINT"].makes /
                      heatmapData["PAINT"].attempts) *
                      100,
                  )}
                />
              )}
              {heatmapData["RA"]?.attempts > 0 && (
                <circle
                  cx="250"
                  cy="47"
                  r="45"
                  fill={getHeatmapColor(
                    (heatmapData["RA"].makes / heatmapData["RA"].attempts) *
                      100,
                  )}
                />
              )}
            </g>
          )}

          {/* Key / Paint */}
          <rect
            x="170"
            y="0"
            width="160"
            height="190"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />

          {/* Free Throw Circle (Top half) */}
          <path
            d="M 170 190 A 60 60 0 0 0 330 190"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />
          {/* Free Throw Circle (Bottom dashed half) */}
          <path
            d="M 170 190 A 60 60 0 0 1 330 190"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
            strokeDasharray="10,10"
          />

          {/* Three Point Line */}
          <line
            x1="30"
            y1="0"
            x2="30"
            y2="140"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />
          <line
            x1="470"
            y1="0"
            x2="470"
            y2="140"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />
          <path
            d="M 30 140 A 220 220 0 0 0 470 140"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />

          {/* Restricted Area Arc */}
          <path
            d="M 210 40 A 40 40 0 0 0 290 40"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />

          {/* Backboard */}
          <line
            x1="220"
            y1="40"
            x2="280"
            y2="40"
            stroke={courtLineColor}
            strokeWidth={strokeWidth * 1.5}
          />

          {/* Rim / Hoop */}
          <circle
            cx="250"
            cy="47"
            r="7"
            fill="none"
            stroke={courtLineColor}
            strokeWidth={strokeWidth}
          />

          {/* Markers / Heatmap Points */}
          <style>{getCourtStyles()}</style>
          {markers.map((marker, index) => {
            const isLatest = index === markers.length - 1;
            let color = marker.color || courtLineColor;
            if (!marker.color) {
              if (marker.type === "MAKE")
                color = "var(--cs-semantic-color-feedback-success-main)";
              else if (marker.type === "MISS")
                color = "var(--cs-semantic-color-feedback-error-main)";
              else if (marker.type === "REBOUND")
                color = "var(--cs-semantic-color-feedback-info-main)";
              else if (marker.type === "STEAL")
                color = "var(--cs-semantic-color-feedback-warning-main)";
              else if (marker.type === "ASSIST")
                color = "var(--cs-semantic-color-brand-primary-main)";
              else if (marker.type === "TURNOVER")
                color = "var(--cs-semantic-color-text-secondary)";
            }

            const svgX = (marker.x / 100) * 500;
            const svgY = (marker.y / 100) * 470;

            const playerName = marker.playerName
              ? marker.playerName
              : marker.label
                ? `#${marker.label}`
                : "Opponent";
            const markerAriaLabel = `${marker.type} by ${playerName} at ${(marker.x ?? 0).toFixed(0)}%, ${(marker.y ?? 0).toFixed(0)}%`;

            return (
              <g
                key={marker.id || index}
                onClick={(e: React.MouseEvent<SVGGElement>) => {
                  e.stopPropagation();
                  if (onMarkerClick) onMarkerClick(marker);
                }}
                onKeyDown={(e: React.KeyboardEvent<SVGGElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    if (onMarkerClick) onMarkerClick(marker);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={markerAriaLabel}
                style={{
                  cursor: onMarkerClick ? "pointer" : "default",
                  outline: "none",
                }}
              >
                <title>{`${marker.type} - ${marker.playerName ? marker.playerName : marker.label ? "#" + marker.label : "Opponent"}`}</title>
                <circle
                  className={isLatest ? "latest-marker" : "court-marker"}
                  cx={svgX}
                  cy={svgY}
                  r="6"
                  fill={color}
                  fillOpacity={isLatest ? "1" : "0.8"}
                  stroke={color}
                  strokeWidth={isLatest ? "2" : "1"}
                />
                {marker.label && (
                  <text
                    x={svgX}
                    y={svgY - 10}
                    fontSize="12"
                    textAnchor="middle"
                    fill={courtLineColor}
                    style={{
                      pointerEvents: "none",
                      fontWeight: "var(--cs-typography-fontWeight-bold)",
                    }}
                  >
                    {marker.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Box>
    );
  },
);

export default BasketballCourt;
