/**
 * @file App.tsx
 * @description Main application entry point for the React frontend.
 * Configures the theme, routing, authentication provider, and layout.
 */

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
} from "@mui/material";
import theme from "./theme";
import Navigation from "./components/Navigation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import DevAuthBypass from "./components/DevAuthBypass";
import { AppRoutes } from "./router/routes";

/**
 * Main layout component containing the navigation and routed page content.
 * Handles the display of the sidebar based on authentication state.
 *
 * @returns {React.ReactElement}
 */
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          left: "-10000px",
          top: "auto",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          "&:focus": {
            position: "fixed",
            top: 16,
            left: 16,
            width: "auto",
            height: "auto",
            bgcolor: "primary.main",
            color: "white",
            p: 2,
            borderRadius: 1,
            zIndex: 10000,
          },
        }}
      >
        Skip to main content
      </Box>
      {/* Show navigation bar only for authenticated users */}
      {isAuthenticated && <Navigation />}

      <Box
        id="main-content"
        component="main"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          pt: {
            xs: isAuthenticated ? "80px" : 2,
            sm: isAuthenticated ? "104px" : 3,
          },
          pb: { xs: 2, sm: 3 },
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 1, sm: 2 },
          }}
        >
          <AppRoutes />
        </Container>
      </Box>
    </Box>
  );
};

/**
 * Root App component providing global providers (Theme, Auth, Router).
 *
 * @returns {React.ReactElement}
 */
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <DevAuthBypass />
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
