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
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: `${(formRow?.gap ?? 24) / 8}rem`,
          py: `${(formRow?.paddingY ?? 20) / 8}rem`,
          minHeight: { xs: "auto", md: `${formRow?.minHeight ?? 80}px` },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", md: `${formRow?.labelWidth ?? 260}px` },
            pr: { xs: 0, md: 2 },
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: description ? 0.5 : 0,
            }}
          >
            {label}
          </Typography>

          {description ? (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                maxWidth: `${formRow?.descriptionMaxWidth ?? 240}px`,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{
            width: "100%",
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
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
