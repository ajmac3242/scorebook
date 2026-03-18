import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2D2D2D", // Charcoal
    },
    secondary: {
      main: "#757575", // Medium grey
    },
    background: {
      default: "#FFFDF5", // Ivory/Cream
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2D2D2D",
      secondary: "#5F5F5F",
    },
  },
  typography: {
    fontFamily: '"EB Garamond", "Playfair Display", "Georgia", serif',
    h1: { fontWeight: 600, color: "#2D2D2D" },
    h2: { fontWeight: 600, color: "#2D2D2D" },
    h3: { fontWeight: 600, color: "#2D2D2D" },
    h4: {
      fontWeight: 500,
      color: "#2D2D2D",
      fontFamily: "system-ui, sans-serif",
    },
    h5: {
      fontWeight: 500,
      color: "#2D2D2D",
      fontFamily: "system-ui, sans-serif",
    },
    h6: {
      fontWeight: 500,
      color: "#2D2D2D",
      fontFamily: "system-ui, sans-serif",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
      fontFamily: "system-ui, sans-serif",
    },
    body1: {
      fontFamily: "system-ui, sans-serif",
    },
    body2: {
      fontFamily: "system-ui, sans-serif",
    },
  },
  shape: {
    borderRadius: 4, // More squared/elegant look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Rounded buttons for a modern touch in a classic theme
          padding: "8px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          },
        },
        containedPrimary: {
          backgroundColor: "#2D2D2D",
          "&:hover": {
            backgroundColor: "#454545",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid #E0E0E0",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.03)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFDF5",
          color: "#2D2D2D",
          boxShadow: "none",
          borderBottom: "1px solid #E0E0E0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
        },
      },
    },
  },
});

export default theme;
