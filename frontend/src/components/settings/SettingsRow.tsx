import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import { useTokens } from "../../theme/useTokens";

interface SettingsRowProps {
  label: string;
  description?: string;
  control: React.ReactNode;
  noDivider?: boolean;
}

function SettingsRow({
  label,
  description,
  control,
  noDivider = false,
}: SettingsRowProps) {
  const tokens = useTokens();
  const formRow = tokens.layout.formRow;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: `${formRow?.labelWidth ?? 260}px minmax(0, 1fr)`,
          },
          alignItems: "start",
          columnGap: {
            xs: 0,
            md: (formRow?.gap ?? 28) / 8,
          },
          rowGap: tokens.semantic.spacing.md / 8,
          py: (formRow?.paddingY ?? 24) / 8,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            alignSelf: "start",
            pt: 0,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.semantic.color.text.primary,
              mb: tokens.semantic.spacing.xs / 8,
            }}
          >
            {label}
          </Typography>

          {description ? (
            <Typography
              variant="body2"
              sx={{
                color: tokens.semantic.color.text.secondary,
                maxWidth: formRow?.descriptionMaxWidth ?? 240,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            minWidth: 0,
            width: "100%",
            alignSelf: "start",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          {control}
        </Box>
      </Box>

      {!noDivider ? (
        <Divider
          sx={{
            borderColor:
              formRow?.dividerColor ?? tokens.semantic.color.border.subtle,
          }}
        />
      ) : null}
    </>
  );
}

export default SettingsRow;
