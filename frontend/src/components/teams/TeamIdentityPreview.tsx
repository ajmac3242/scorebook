import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";
import { getInitials } from "../../utils/stats";

type TeamIdentityPreviewProps = {
  teamName: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
};

const buildPreviewColors = (value: string) => ({
  solid: value,
  soft: `${value}1F`,
  softer: `${value}14`,
  border: `${value}3D`,
});

const TeamIdentityPreview: React.FC<TeamIdentityPreviewProps> = ({
  teamName,
  description,
  logoUrl,
  primaryColor,
}) => {
  const tokens = useTokens();
  const colors = buildPreviewColors(primaryColor);
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 12);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: tokens.semantic.color.border.subtle,
        borderRadius: `${tokens.semantic.shape.radius.lg}px`,
        overflow: "hidden",
        bgcolor: tokens.semantic.color.background.paper,
      }}
    >
      <Box
        sx={{
          height: tokens.semantic.component.entityCard.accentStripHeight,
          bgcolor: colors.solid,
        }}
      />
      <Stack
        direction="row"
        spacing={tokens.layout.pagePaddingXUnits / 1.5}
        sx={{ p: tokens.layout.pagePaddingXUnits / 1.2, alignItems: "center" }}
      >
        {logoUrl.trim() ? (
          <Avatar
            src={logoUrl.trim()}
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              borderRadius: `${controlRadius}px`,
              border: `1px solid ${colors.border}`,
              bgcolor: colors.softer,
            }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              borderRadius: `${controlRadius}px`,
              bgcolor: colors.soft,
              color: colors.solid,
              border: `1px solid ${colors.border}`,
              fontWeight: 700,
            }}
          >
            {getInitials(teamName || "Team")}
          </Avatar>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.semantic.color.text.primary,
            }}
          >
            {teamName.trim() || "New team"}
          </Typography>
          {description.trim() ? (
            <Typography
              variant="body2"
              sx={{ color: tokens.semantic.color.text.secondary }}
            >
              {description.trim()}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
};

export default TeamIdentityPreview;
