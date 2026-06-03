import React from "react";
import {
  Box,
  Button,
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
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleClear = () => {
    onClearSearch?.();
    if (!onClearSearch) onSearchChange("");
  };

  return (
    <Stack
      direction="row"
      sx={{
        mb: 2,
        gap: 1.5,
        alignItems: "center",
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
            borderRadius: `${controlRadius}px`,
            fontSize: "var(--cs-typography-fontSize-sm)",
            bgcolor: "var(--cs-semantic-color-surface-subtle)",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon
                sx={{
                  fontSize: 18,
                  color: "var(--cs-semantic-color-text-muted)",
                }}
              />
            </InputAdornment>
          ),
          endAdornment: searchValue ? (
            <InputAdornment position="end">
              <Tooltip title="Clear">
                <Box
                  component="button"
                  onClick={handleClear}
                  aria-label="Clear search"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0.25,
                    border: "none",
                    bgcolor: "transparent",
                    cursor: "pointer",
                    color: "var(--cs-semantic-color-text-muted)",
                    borderRadius: "9999px",
                    "&:hover": {
                      bgcolor: "var(--cs-semantic-color-surface-dynamic)",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </Box>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
        }}
      />

      <Box sx={{ display: { xs: "none", sm: "flex" }, flexShrink: 0 }}>
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
                textTransform: "none",
                fontWeight: 700,
                borderRadius: `${controlRadius}px`,
                boxShadow: "none",
                px: 2,
                minHeight: 36,
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
