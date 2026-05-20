import React from "react";
import { Box, Card, Typography, type BoxProps, type CardProps, type TypographyProps } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

export const TokenPageShell: React.FC<BoxProps> = ({ sx, children, ...props }) => {
  const tokens = useTokens();
  const layout = tokens.layout;

  return (
    <Box
      {...props}
      sx={{
        px: { xs: layout.pagePanelPaddingMobile / 8, md: layout.pagePaddingX / 8 },
        py: { xs: 2, md: 3 },
        maxWidth: layout.pageMaxWidth,
        mx: "auto",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export const TokenSectionCard: React.FC<CardProps> = ({ sx, children, ...props }) => {
  const tokens = useTokens();
  const sectionCard = tokens.semantic.component.sectionCard;
  const layout = tokens.layout;

  return (
    <Card
      {...props}
      sx={{
        borderRadius: `${sectionCard.radius}px`,
        border: sectionCard.border,
        boxShadow: sectionCard.shadow,
        bgcolor: sectionCard.background,
        p: { xs: layout.sectionCardPaddingCompact / 8, md: layout.sectionCardPadding / 8 },
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

export const TokenPageTitle: React.FC<TypographyProps> = ({ sx, children, ...props }) => {
  return (
    <Typography variant="h5" sx={{ fontWeight: 600, ...sx }} {...props}>
      {children}
    </Typography>
  );
};

export const TokenSectionTitle: React.FC<TypographyProps> = ({ sx, children, ...props }) => {
  return (
    <Typography variant="h6" sx={{ fontWeight: 600, ...sx }} {...props}>
      {children}
    </Typography>
  );
};
