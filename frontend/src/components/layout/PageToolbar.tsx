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
        mb: 2,
        gap: 1.5,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        borderBottom: "1px solid",
        borderColor: "divider",
        pb: 1.5,
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
            borderRadius: `${radius}px`,
            fontSize: "var(--cs-typography-fontSize-sm)",
            bgcolor: "var(--cs-semantic-color-surface-subtle)",
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
                    color: "var(--cs-semantic-color-text-muted)",
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
                      color: "var(--cs-semantic-color-text-muted)",
                      p: 0.25,
                      "&:hover": {
                        bgcolor: "var(--cs-semantic-color-surface-dynamic)",
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
              sx={{
                px: `${tokens.semantic.spacing.md / 8}px`,
                width: { xs: "100%", sm: "auto" },
                "&.Mui-disabled": { opacity: 0.4 },
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
