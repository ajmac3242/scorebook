import React from "react";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

export type ActionBarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (_value: string) => void;
  actionLabel: string;
  actionAriaLabel?: string;
  onActionClick: () => void;
  actionIcon?: React.ReactNode;
  actionDisabled?: boolean;
  controlRadius: number;
  mobileActionHidden?: boolean;
};

const ActionBar: React.FC<ActionBarProps> = ({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionLabel,
  actionAriaLabel,
  onActionClick,
  actionIcon = <AddIcon />,
  actionDisabled = false,
  controlRadius,
  mobileActionHidden = true,
}) => {
  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        pb: 1.5,
      }}
    >
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: `${controlRadius}px`,
            fontSize: "var(--cs-typography-fontSize-sm)",
            bgcolor: "var(--cs-semantic-color-surface-subtle)",
          },
        }}
        slotProps={{
          input: {
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
          },
        }}
      />

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
                textTransform: "none",
                fontWeight: 700,
                borderRadius: `${controlRadius}px`,
                boxShadow: "none",
                px: 2,
                minHeight: 36,
                "&.Mui-disabled": { opacity: 0.4 },
              }}
            >
              {actionLabel}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ActionBar;
