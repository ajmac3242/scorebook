import React from "react";
import { Box, SxProps, Theme } from "@mui/material";

type PageWidth = "narrow" | "default" | "wide" | "full";

interface PageContainerProps {
  children: React.ReactNode;
  width?: PageWidth;
  sx?: SxProps<Theme>;
}

const widthMap: Record<PageWidth, string> = {
  narrow: "720px",
  default: "960px",
  wide: "1280px",
  full: "100%",
};

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = "full",
  sx,
}) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: width === "full" ? "100%" : widthMap[width],
        minWidth: 0,
        mx: "auto",
        px: "var(--cs-semantic-spacing-pagePaddingX)",
        py: "var(--cs-semantic-spacing-pagePaddingY)",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default PageContainer;
