import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#287094", // Medium Blue
      light: "#5A9BBD",
      dark: "#023246", // Navy Blue
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D4D4CE", // Warm Gray
      light: "#F6F6F6", // Off White
      dark: "#A8A8A0",
      contrastText: "#023246",
    },
    success: {
      main: "#4E7D5B", // Sage Green
    },
    error: {
      main: "#A64444", // Muted Red
    },
    warning: {
      main: "#D99E32", // Ochre
    },
    info: {
      main: "#5A7381", // Blue Ash
    },
    background: {
      default: "#F6F6F6", // Off White from palette
      paper: "#FFFFFF",
    },
    text: {
      primary: "#023246", // Navy Blue for text
      secondary: "#5A7381", // Blue Ash
    },
  },
  typography: {
    fontFamily: '"EB Garamond", "Playfair Display", "Georgia", serif',
    h1: { fontWeight: 600, color: "#023246" },
    h2: { fontWeight: 600, color: "#023246" },
    h3: { fontWeight: 600, color: "#023246" },
    h4: {
      fontWeight: 500,
      color: "#023246",
      fontFamily: "system-ui, sans-serif",
    },
    h5: {
      fontWeight: 500,
      color: "#023246",
      fontFamily: "system-ui, sans-serif",
    },
    h6: {
      fontWeight: 500,
      color: "#023246",
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
    borderRadius: 8, // Standard Material Design rounding
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');

        :root {
          --palette-medium-blue: #287094;
          --palette-warm-gray: #D4D4CE;
          --palette-off-white: #F6F6F6;
          --palette-navy-blue: #023246;
          --palette-golden-dune: #D99E32;
          --palette-midnight: #023246;
          --serif: "EB Garamond", serif;
          --sans: system-ui, -apple-system, sans-serif;
        }

        body {
          background-color: var(--palette-off-white);
          background-image: radial-gradient(#D1D1D1 0.5px, transparent 0.5px);
          background-size: 24px 24px;
          background-attachment: fixed;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }

        /* Small interactions for icons */
        .MuiIconButton-root {
          transition: transform 0.2s ease-in-out, background-color 0.2s;
        }
        .MuiIconButton-root:hover {
          transform: scale(1.1);
        }
        .MuiIconButton-root:active {
          transform: scale(0.95);
        }

        /* Small interactions for buttons */
        .MuiButton-root {
          transition: transform 0.1s ease-in-out, box-shadow 0.2s;
        }
        .MuiButton-root:hover {
          transform: translateY(-1px);
        }
        .MuiButton-root:active {
          transform: translateY(1px);
        }

        .moleskine-card {
          border-radius: 8px;
          box-shadow: 0px 4px 12px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.05);
          background-color: #FFFFFF;
          padding: 16px;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "8px 22px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          },
          "&.Mui-focusVisible": {
            outline: "2px solid #023246",
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: "2px solid #023246",
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#023246",
          boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

export default theme;
