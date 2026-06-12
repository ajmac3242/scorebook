import React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  useTheme,
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
  controlRadius: number;
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
  controlRadius,
}) => {
  const theme = useTheme();
  const tokens = useTokens();

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
        gap: tokens.layout.pagePaddingXUnits / 2,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
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
            bgcolor: tokens.semantic.color.surface.subtle,
          },
        }}
        slotProps={{
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
                      color: tokens.semantic.color.text.muted,
                      p: tokens.layout.pagePaddingXUnits / 12,
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
              sx={{
                width: { xs: "100%", sm: "auto" },
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
