import { useCallback, useState } from "react";

export type SnackbarSeverity = "success" | "error" | "info" | "warning";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
};

export type UsePageSnackbarReturn = {
  snackbar: SnackbarState;
  showSnackbar: (_message: string, _severity?: SnackbarSeverity) => void;
  hideSnackbar: () => void;
};

const INITIAL_SNACKBAR_STATE: SnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

/**
 * Shared state helper for page-level feedback snackbars.
 * Pair with <PageSnackbar> to render the notification.
 *
 * @example
 * const { snackbar, showSnackbar, hideSnackbar } = usePageSnackbar();
 * showSnackbar("Saved successfully.");
 * showSnackbar("Something went wrong.", "error");
 * return <PageSnackbar {...snackbar} onClose={hideSnackbar} />;
 */
export function usePageSnackbar(): UsePageSnackbarReturn {
  const [snackbar, setSnackbar] = useState<SnackbarState>(
    INITIAL_SNACKBAR_STATE,
  );

  const showSnackbar = useCallback(
    (message: string, severity: SnackbarSeverity = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    [],
  );

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return { snackbar, showSnackbar, hideSnackbar };
}

export default usePageSnackbar;
