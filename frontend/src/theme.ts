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
      paper: "#FFFDF5", // Keep paper same for Moleskine feel
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
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');

        :root {
          --moleskine-ivory: #FFFDF5;
          --moleskine-charcoal: #2D2D2D;
          --moleskine-grey: #D1D1D1;
          --serif: "EB Garamond", serif;
          --sans: system-ui, -apple-system, sans-serif;
        }

        body {
          background-color: var(--moleskine-ivory);
          background-image: radial-gradient(var(--moleskine-grey) 0.5px, transparent 0.5px);
          background-size: 20px 20px;
          background-attachment: fixed;
        }

        .moleskine-card {
          background-color: #FFFFFF !important;
          border: 1px solid var(--moleskine-grey) !important;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.05) !important;
          border-radius: 2px !important;
          position: relative;
        }

        .moleskine-card::before {
          content: "";
          position: absolute;
          left: 40px;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: rgba(255, 0, 0, 0.1);
          pointer-events: none;
        }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: "6px 20px",
          boxShadow: "none",
          border: "1px solid #2D2D2D",
          "&:hover": {
            boxShadow: "2px 2px 0px rgba(0,0,0,0.1)",
            backgroundColor: "rgba(0,0,0,0.02)",
          },
        },
        containedPrimary: {
          backgroundColor: "#2D2D2D",
          color: "#FFFDF5",
          "&:hover": {
            backgroundColor: "#454545",
          },
        },
        outlinedPrimary: {
          borderColor: "#2D2D2D",
          color: "#2D2D2D",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          border: "1px solid #D1D1D1",
          boxShadow: "2px 2px 0px rgba(0,0,0,0.05)",
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFDF5",
          color: "#2D2D2D",
          boxShadow: "none",
          borderBottom: "1px solid #D1D1D1",
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
