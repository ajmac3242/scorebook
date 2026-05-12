/**
 * @file CourtSightLogo.tsx
 * @description CourtSight wordmark + basketball-arc icon SVG React component.
 * Used in TopAppBar, SideNav header, and login screen.
 */
import React from "react";

interface CourtSightLogoProps {
  /** Width of the logo. Height scales proportionally. Default: 140 */
  width?: number;
  /** Show mark-only (no wordmark). Default: false */
  markOnly?: boolean;
}

/**
 * CourtSight logo — wordmark "CourtSight" in Inter Bold
 * with a basketball arc icon in Electric Orange (#FF6B1A).
 */
const CourtSightLogo: React.FC<CourtSightLogoProps> = ({
  width = 140,
  markOnly = false,
}) => {
  const height = Math.round(width * 0.3);
  const markSize = Math.round(width * 0.22);

  if (markOnly) {
    return (
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CourtSight mark"
        role="img"
      >
        {/* Basketball circle */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="#FF6B1A"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Vertical seam */}
        <path
          d="M16 2 Q16 16 16 30"
          stroke="#FF6B1A"
          strokeWidth="1.8"
          fill="none"
        />
        {/* Horizontal seam */}
        <path
          d="M2 16 Q16 16 30 16"
          stroke="#FF6B1A"
          strokeWidth="1.8"
          fill="none"
        />
        {/* Top-left arc seam */}
        <path
          d="M5 6 Q10 16 5 26"
          stroke="#FF6B1A"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Top-right arc seam */}
        <path
          d="M27 6 Q22 16 27 26"
          stroke="#FF6B1A"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Eye / sight dot overlay */}
        <circle cx="16" cy="16" r="3.5" fill="#FF6B1A" />
        <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CourtSight"
      role="img"
    >
      {/* Basketball arc icon */}
      <circle
        cx="20"
        cy="21"
        r="13"
        stroke="#FF6B1A"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M20 8 Q20 21 20 34"
        stroke="#FF6B1A"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M7 21 Q20 21 33 21"
        stroke="#FF6B1A"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M10 11 Q14 21 10 31"
        stroke="#FF6B1A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 11 Q26 21 30 31"
        stroke="#FF6B1A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Sight dot */}
      <circle cx="20" cy="21" r="3" fill="#FF6B1A" />
      <circle cx="20" cy="21" r="1.2" fill="#FFFFFF" />

      {/* Wordmark: CourtSight */}
      <text
        x="40"
        y="28"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        <tspan fill="#FF6B1A">Court</tspan>
        <tspan>Sight</tspan>
      </text>
    </svg>
  );
};

export default CourtSightLogo;
