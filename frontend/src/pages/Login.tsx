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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";
import { SportsBasketball } from "@mui/icons-material";
import { db } from "../db";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

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
        setError(err.message || JSON.stringify(err));
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
            gap: 3,
          }}
        >
          <SportsBasketball
            sx={{
              fontSize: 80,
              color: "primary.main",
              animation: "spin 2s linear infinite",
            }}
          />
          <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
            Loading notebook data...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing your coaching dashboard
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <SportsBasketball
              aria-hidden="true"
              sx={{ color: "white", fontSize: 40 }}
            />
          </Box>
          <Typography component="h1" variant="h5" gutterBottom>
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
