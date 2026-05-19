import React from "react";
import { Box, SxProps, Theme } from "@mui/material";

type PageWidth = "narrow" | "default" | "wide" | "full";

interface PageContainerProps {
  children: React.ReactNode;
  /** Controls max width of the content region inside the main area */
  width?: PageWidth;
  sx?: SxProps<Theme>;
}

const widthMap: Record<PageWidth, string> = {
  narrow: "720px",
  default: "960px",
  wide: "1280px",
  full: "100%",
};

/**
 * PageContainer — standard page framing that sits inside AppShell's gutters.
 * - Uses app-level gutters defined by AppShell
 * - Allows page-specific width overrides
 * @param root0
 * @param root0.children
 * @param root0.width
 * @param root0.sx
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = "wide",
  sx,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: width === "full" ? "none" : widthMap[width],
        minWidth: 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
