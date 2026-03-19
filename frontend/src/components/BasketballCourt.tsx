import React from "react";
import { Box } from "@mui/material";

interface Marker {
  id?: string | number;
  x: number;
  y: number;
  type: string;
  label?: string;
}

const BasketballCourt: React.FC<{
  onCoordClick?: (x: number, y: number) => void;
  markers?: Marker[];
}> = ({ onCoordClick, markers = [] }) => {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onCoordClick) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCoordClick(x, y);
  };

  const charcoal = "#2D2D2D";
  const strokeWidth = 2;

  return (
    <Box
      sx={{
        width: "100%",
        aspectRatio: "50 / 47",
        position: "relative",
        bgcolor: "#FFFDF5",
      }}
    >
      <svg
        viewBox="0 0 500 470"
        onClick={handleClick}
        style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Out of bounds / Court Perimeter */}
        <rect
          x="0"
          y="0"
          width="500"
          height="470"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />

        {/* Key / Paint */}
        <rect
          x="170"
          y="0"
          width="160"
          height="190"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />

        {/* Free Throw Circle (Top half) */}
        <path
          d="M 170 190 A 60 60 0 0 0 330 190"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />
        {/* Free Throw Circle (Bottom dashed half) */}
        <path
          d="M 170 190 A 60 60 0 0 1 330 190"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
          strokeDasharray="10,10"
        />

        {/* Three Point Line */}
        {/* Side lines */}
        <line
          x1="30"
          y1="0"
          x2="30"
          y2="140"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />
        <line
          x1="470"
          y1="0"
          x2="470"
          y2="140"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />
        {/* Arc - starts at y=140 on both sides, center is hoop (250, 40), radius approx 220-237 depending on scale */}
        {/* Standard FIBA: 6.75m. NBA: 7.24m. High School: 6.02m. */}
        {/* Using a visually representative arc */}
        <path
          d="M 30 140 A 220 220 0 0 0 470 140"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />

        {/* Restricted Area Arc */}
        <path
          d="M 210 40 A 40 40 0 0 0 290 40"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />

        {/* Backboard */}
        <line
          x1="220"
          y1="40"
          x2="280"
          y2="40"
          stroke={charcoal}
          strokeWidth={strokeWidth * 1.5}
        />

        {/* Rim / Hoop */}
        <circle
          cx="250"
          cy="47"
          r="7"
          fill="none"
          stroke={charcoal}
          strokeWidth={strokeWidth}
        />

        {/* Markers / Heatmap Points */}
        <style>
          {`
            @keyframes marker-appear {
              0% { transform: scale(0); opacity: 0; }
              70% { transform: scale(1.2); opacity: 1; }
              100% { transform: scale(1); opacity: 0.6; }
            }
            .court-marker {
              animation: marker-appear 0.3s ease-out forwards;
              transform-origin: center;
              transform-box: fill-box;
            }
            .latest-marker {
              animation: marker-appear 0.3s ease-out forwards, pulse 2s infinite 0.3s;
              opacity: 1 !important;
            }
            @keyframes pulse {
              0% { r: 6; stroke-width: 1; }
              50% { r: 8; stroke-width: 3; }
              100% { r: 6; stroke-width: 1; }
            }
          `}
        </style>
        {markers.map((marker, index) => {
          const isLatest = index === markers.length - 1;
          let color = "#2D2D2D";
          if (marker.type === "MAKE") color = "#4CAF50";
          else if (marker.type === "MISS") color = "#F44336";
          else if (marker.type === "REBOUND") color = "#2196F3";
          else if (marker.type === "STEAL") color = "#FF9800";
          else if (marker.type === "ASSIST") color = "#9C27B0";
          else if (marker.type === "TURNOVER") color = "#795548";

          // Convert percentage back to SVG coordinates (0-500, 0-470)
          const svgX = (marker.x / 100) * 500;
          const svgY = (marker.y / 100) * 470;

          return (
            <g key={marker.id || index}>
              <circle
                className={isLatest ? "latest-marker" : "court-marker"}
                cx={svgX}
                cy={svgY}
                r="6"
                fill={color}
                fillOpacity={isLatest ? "1" : "0.6"}
                stroke={color}
                strokeWidth={isLatest ? "2" : "1"}
              />
              {marker.label && (
                <text
                  x={svgX}
                  y={svgY - 8}
                  fontSize="10"
                  textAnchor="middle"
                  fill={charcoal}
                  style={{ pointerEvents: "none", fontWeight: "bold" }}
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
};

export default BasketballCourt;
