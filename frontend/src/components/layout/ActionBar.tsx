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
import { useTokens } from "../../theme/useTokens";

export type ActionBarProps = {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (_value: string) => void;
  actionLabel?: string;
  actionAriaLabel?: string;
  onActionClick?: () => void;
  actionIcon?: React.ReactNode;
  actionDisabled?: boolean;
  mobileActionHidden?: boolean;
  /** @deprecated Tokens are now internalized. Radius is derived from tokens.semantic.component.radius.button */
  controlRadius?: number;
  hideSearch?: boolean;
  hideAction?: boolean;
  filtersSlot?: React.ReactNode;
  trailingSlot?: React.ReactNode;
};

const ActionBar: React.FC<ActionBarProps> = ({
  searchPlaceholder = "Search",
  searchValue = "",
  onSearchChange,
  actionLabel = "",
  actionAriaLabel,
  onActionClick,
  actionIcon = <AddIcon />,
  actionDisabled = false,
  mobileActionHidden = true,
  hideSearch = false,
  hideAction = false,
  filtersSlot,
  trailingSlot,
}) => {
  const tokens = useTokens();
  const radius = tokens.semantic.component.radius.button;

  return (
    <Box
      sx={{
        mb: tokens.semantic.spacing.md / 8,
        display: "flex",
        flexWrap: "wrap",
        gap: tokens.semantic.spacing.sm / 8,
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: tokens.semantic.color.border.subtle,
        pb: tokens.semantic.spacing.sm / 8,
      }}
    >
      {!hideSearch && onSearchChange && (
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            minWidth: 160,
            "& .MuiOutlinedInput-root": {
              borderRadius: `${radius}px`,
              fontSize: tokens.typography.fontSize.sm,
              bgcolor: tokens.semantic.color.surface.subtle,
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{
                      fontSize: 18,
                      color: tokens.semantic.color.text.muted,
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: searchValue ? (
                <InputAdornment position="end">
                  <Tooltip title="Clear">
                    <Box
                      component="button"
                      onClick={() => onSearchChange("")}
                      aria-label="Clear search"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 0.25,
                        border: "none",
                        bgcolor: "transparent",
                        cursor: "pointer",
                        color: tokens.semantic.color.text.muted,
                        borderRadius: "9999px",
                        "&:hover": {
                          bgcolor: tokens.semantic.color.surface.dynamic,
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </Box>
                  </Tooltip>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      )}

      {filtersSlot && (
        <Stack
          direction="row"
          spacing={tokens.semantic.spacing.sm / 8}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          {filtersSlot}
        </Stack>
      )}

      {hideSearch && !filtersSlot && <Box sx={{ flex: 1 }} />}

      {!hideAction && onActionClick && actionLabel && (
        <Box
          sx={{
            display: mobileActionHidden ? { xs: "none", sm: "flex" } : "flex",
            flexShrink: 0,
          }}
        >
          <Tooltip title={actionDisabled ? "" : actionLabel} placement="left">
            <span>
              <Button
                variant="contained"
                size="small"
                onClick={onActionClick}
                disabled={actionDisabled}
                startIcon={actionIcon}
                aria-label={actionAriaLabel || actionLabel}
                sx={{
                  px: `${tokens.semantic.spacing.md / 8}px`,
                  width: { xs: "100%", sm: "auto" },
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                {actionLabel}
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      {trailingSlot}
    </Box>
  );
};

export default ActionBar;
