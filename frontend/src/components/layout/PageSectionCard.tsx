import React from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

interface PageSectionCardProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const PageSectionCard: React.FC<PageSectionCardProps> = ({ children, sx }) => {
  const tokens = useTokens();
  const sectionCard = tokens.semantic.component.sectionCard;

  return (
    <Box
      sx={{
        borderRadius: `${sectionCard?.radius ?? 12}px`,
        border:
          sectionCard?.border ??
          "1px solid var(--cs-semantic-color-border-subtle)",
        background:
          sectionCard?.background ??
          "var(--cs-semantic-color-background-paper)",
        boxShadow: sectionCard?.shadow ?? "none",
        overflow: "hidden",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default PageSectionCard;
