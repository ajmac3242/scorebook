import React from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

interface PageSectionCardProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

function PageSectionCard({ children, sx }: PageSectionCardProps) {
  const tokens = useTokens();
  const sectionCard = tokens.semantic.component.sectionCard;

  return (
    <Box
      sx={[
        {
          width: "100%",
          minWidth: 0,
          background: sectionCard?.background ?? "transparent",
          border: sectionCard?.border ?? "none",
          borderRadius: `${sectionCard?.radius ?? 0}px`,
          boxShadow: sectionCard?.shadow ?? "none",
          overflow: "visible",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}

export default PageSectionCard;