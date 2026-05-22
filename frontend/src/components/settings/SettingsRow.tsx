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
            md: `${(formRow?.gap ?? 28) / 8}rem`,
          },
          rowGap: 2,
          py: `${(formRow?.paddingY ?? 24) / 8}rem`,
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
              fontWeight: 600,
              color: "text.primary",
              mb: 0.5,
            }}
          >
            {label}
          </Typography>

          {description ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
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
              formRow?.dividerColor ?? "var(--cs-semantic-color-border-subtle)",
          }}
        />
      ) : null}
    </>
  );
}

export default SettingsRow;
