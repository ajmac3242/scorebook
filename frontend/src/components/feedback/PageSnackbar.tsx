import React from "react";
import { Alert, Snackbar, useMediaQuery, useTheme } from "@mui/material";
import type { SnackbarSeverity } from "../../hooks/usePageSnackbar";
import { useTokens } from "../../theme/useTokens";

export type PageSnackbarProps = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  onClose: () => void;
  autoHideDuration?: number;
};

/**
 * Shared page-level snackbar with standardized placement and token-driven shape.
 * Positions at the bottom on desktop, top on mobile to avoid the FAB/nav area.
 */
const PageSnackbar: React.FC<PageSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 4000,
}) => {
  const theme = useTheme();
  const tokens = useTokens();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{
        vertical: isMobile ? "top" : "bottom",
        horizontal: "center",
      }}
      sx={{
        mb: isMobile ? 0 : 8,
        mt: isMobile ? 7 : 0,
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          borderRadius: `${tokens.semantic.component.radius.button}px`,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default PageSnackbar;
