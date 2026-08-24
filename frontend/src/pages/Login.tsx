import React, { useState } from "react";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { SportsBasketball } from "@mui/icons-material";
import { db } from "../db";
import { useTokens } from "../theme/useTokens";

const Login: React.FC = () => {
  const tokens = useTokens();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");

    const user = new CognitoUser({
      Username: username,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: async (_data) => {
        setIsLoadingData(true);

        try {
          // Trigger a full pull sync immediately after login
          await syncService.pullAll();

          // Check if there's a favorite team
          const favoriteTeam = await db.teams
            .where("isFavorite")
            .equals(1)
            .first();

          setIsAuthenticated(true);
          localStorage.setItem("isAuthenticated", "true");

          if (favoriteTeam) {
            navigate("/");
          } else {
            // If no favorite team, navigate to teams to encourage setup
            navigate("/teams");
          }
        } catch (err) {
          logger.error("Data sync failed after login", err);
          setIsAuthenticated(true);
          localStorage.setItem("isAuthenticated", "true");
          navigate("/");
        } finally {
          setIsLoadingData(false);
        }
      },
      onFailure: (err) => {
        logger.error("Authentication failed", err);
        // 🛡️ Sentinel: Sanitize Cognito error messages specifically targeting user enumeration/internal Cognito exception classes while preserving standard/network errors.
        let userMessage =
          err?.message ||
          "Authentication failed. Please check your credentials.";
        if (err && typeof err.message === "string") {
          const msg = err.message;
          if (
            msg.includes("Incorrect username or password") ||
            msg.includes("UserNotFoundException") ||
            msg.includes("User does not exist") ||
            msg.includes("NotAuthorizedException")
          ) {
            userMessage = "Incorrect username or password.";
          } else if (
            msg.includes("Password attempts exceeded") ||
            msg.includes("LimitExceededException")
          ) {
            userMessage = "Too many failed attempts. Please try again later.";
          } else if (
            msg.includes("User is not confirmed") ||
            msg.includes("UserNotConfirmedException")
          ) {
            userMessage = "Account is not confirmed. Please verify your email.";
          }
        }
        setError(userMessage);
        setIsLoggingIn(false);
      },
      newPasswordRequired: (_userAttributes, _requiredAttributes) => {
        setError("New password required");
      },
    });
  };

  if (isLoadingData) {
    return (
      <Container maxWidth="xs">
        <Box
          sx={{
            mt: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: tokens.semantic.spacing.md / 8,
          }}
        >
          <SportsBasketball
            sx={{
              fontSize: 80,
              color: tokens.semantic.color.brand.primary.main,
              animation: "spin 2s linear infinite",
            }}
          />
          <Typography
            variant="h5"
            sx={{ fontFamily: tokens.typography.fontFamily.accent }}
          >
            Loading notebook data...
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: tokens.semantic.color.text.secondary }}
          >
            Preparing your coaching dashboard
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: tokens.semantic.spacing.xl / 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: `${tokens.semantic.spacing.lg}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: `${tokens.semantic.shape.radius.lg}px`,
            border: `1px solid ${tokens.semantic.color.border.subtle}`,
            boxShadow: tokens.semantic.elevation.shadow.card,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: tokens.semantic.color.brand.primary.main,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: tokens.semantic.spacing.xs / 8,
            }}
          >
            <SportsBasketball
              aria-hidden="true"
              sx={{
                color: tokens.semantic.color.text.inverse,
                fontSize: 40,
              }}
            />
          </Box>
          <Typography
            component="h1"
            variant="h5"
            gutterBottom
            sx={{ fontWeight: tokens.typography.fontWeight.bold }}
          >
            Sign In
          </Typography>
          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              slotProps={{
                input: {
                  sx: { borderRadius: tokens.semantic.component.radius.button },
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  sx: { borderRadius: tokens.semantic.component.radius.button },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                height: 42,
                borderRadius: tokens.semantic.component.radius.button,
                boxShadow: "none",
                fontWeight: 600,
              }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
