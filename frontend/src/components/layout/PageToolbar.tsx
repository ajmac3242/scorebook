import React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useTokens } from "../../theme/useTokens";

interface PageToolbarProps {
  id?: string;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (_value: string) => void;
  onClearSearch?: () => void;
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  primaryProps?: Record<string, unknown>;
  /** @deprecated Tokens are now internalized. Radius is derived from tokens.semantic.component.radius.button */
  controlRadius?: number;
}

export const PageToolbar: React.FC<PageToolbarProps> = ({
  id,
  placeholder = "Search",
  searchValue,
  onSearchChange,
  onClearSearch,
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  primaryProps,
}) => {
  const tokens = useTokens();
  const radius = tokens.semantic.component.radius.button;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleClear = () => {
    onClearSearch?.();
    if (!onClearSearch) onSearchChange("");
  };

  return (
    <Stack
      sx={{
        mb: tokens.semantic.spacing.md / 8,
        gap: tokens.semantic.spacing.sm / 8,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        borderBottom: "1px solid",
        borderColor: "divider",
        pb: tokens.semantic.spacing.sm / 8,
      }}
    >
      <TextField
        id={id}
        size="small"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: radius,
            fontSize: tokens.typography.fontSize.sm,
            bgcolor: tokens.semantic.color.surface.subtle,
          },
        }}
        slotProps={{
          htmlInput: {
            "aria-label": "Search",
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    fontSize: tokens.semantic.component.iconSize.sm,
                    color: tokens.semantic.color.text.muted,
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: searchValue ? (
              <InputAdornment position="end">
                <Tooltip title="Clear">
                  <IconButton
                    onClick={handleClear}
                    aria-label="Clear search"
                    size="small"
                    edge="end"
                    sx={{
                      color: tokens.semantic.color.text.muted,
                      p: 0.25,
                      "&:hover": {
                        bgcolor: tokens.semantic.color.action.hover,
                      },
                    }}
                  >
                    <CloseIcon
                      sx={{ fontSize: tokens.semantic.component.iconSize.xs }}
                    />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />

      <Box
        sx={{
          display: { xs: primaryDisabled ? "none" : "flex", md: "flex" },
          flexShrink: 0,
        }}
      >
        <Tooltip title={primaryDisabled ? "" : primaryLabel} placement="left">
          <span>
            <Button
              variant="contained"
              size="small"
              onClick={onPrimaryClick}
              disabled={primaryDisabled}
              startIcon={<AddIcon />}
              aria-label={primaryLabel}
              {...primaryProps}
              sx={{
                px: tokens.semantic.spacing.md / 8,
                width: { xs: "100%", sm: "auto" },
                "&.Mui-disabled": { opacity: 0.4 },
                "&:focus-visible": {
                  outline: `${tokens.semantic.focus.width}px solid ${tokens.semantic.color.action.focusRing}`,
                  outlineOffset: tokens.semantic.focus.offset,
                },
              }}
            >
              {primaryLabel}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Stack>
  );
};
