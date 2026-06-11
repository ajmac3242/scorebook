import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";
import { getInitials } from "../../utils/stats";

type PlayerIdentityPreviewProps = {
  playerName: string;
  avatarColor: string;
  isStar: boolean;
};

const PlayerIdentityPreview: React.FC<PlayerIdentityPreviewProps> = ({
  playerName,
  avatarColor,
  isStar,
}) => {
  const tokens = useTokens();
  const controlRadius = Math.max(tokens.semantic.component.radius.button, 12);
  const soft = `${avatarColor}1F`;
  const border = `${avatarColor}3D`;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ height: 6, bgcolor: avatarColor }} />
      <Stack direction="row" spacing={2} sx={{ p: 2.5, alignItems: "center" }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 56,
            height: 56,
            borderRadius: `${controlRadius}px`,
            bgcolor: soft,
            color: avatarColor,
            border: `1px solid ${border}`,
            fontWeight: tokens.semantic.typography.h6.fontWeight,
            fontSize: tokens.semantic.typography.h5.fontSize,
          }}
        >
          {getInitials(playerName || "Player")}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {playerName.trim() || "New player"}
            </Typography>
            {isStar && (
              <StarIcon
                sx={{
                  fontSize: tokens.semantic.component.iconSize.sm,
                  color: "warning.main",
                }}
              />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Active player
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

export default PlayerIdentityPreview;
