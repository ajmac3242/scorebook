import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#154C56", // Deep Ocean
      light: "#3D7A86",
      dark: "#0D3138",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#D9B382", // Golden Dune
      light: "#E6CCAA",
      dark: "#B88E56",
      contrastText: "#1F2D33",
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
      default: "#F5F5F5", // Light Grey
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1F2D33", // Midnight
      secondary: "#5A7381", // Blue Ash
    },
  },
  typography: {
    fontFamily: '"EB Garamond", "Playfair Display", "Georgia", serif',
    h1: { fontWeight: 600, color: "#1F2D33" },
    h2: { fontWeight: 600, color: "#1F2D33" },
    h3: { fontWeight: 600, color: "#1F2D33" },
    h4: {
      fontWeight: 500,
      color: "#1F2D33",
      fontFamily: "system-ui, sans-serif",
    },
    h5: {
      fontWeight: 500,
      color: "#1F2D33",
      fontFamily: "system-ui, sans-serif",
    },
    h6: {
      fontWeight: 500,
      color: "#1F2D33",
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
          --palette-deep-ocean: #154C56;
          --palette-golden-dune: #D9B382;
          --palette-midnight: #1F2D33;
          --palette-light-grey: #F5F5F5;
          --palette-sage-green: #4E7D5B;
          --palette-muted-red: #A64444;
          --palette-ochre: #D99E32;
          --palette-blue-ash: #5A7381;
          --serif: "EB Garamond", serif;
          --sans: system-ui, -apple-system, sans-serif;
        }

        body {
          background-color: var(--palette-light-grey);
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
          color: "#1F2D33",
          boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

export default theme;
