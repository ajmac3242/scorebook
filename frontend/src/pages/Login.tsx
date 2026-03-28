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

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
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
      onSuccess: (_data) => {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        // Trigger a full pull sync immediately after login
        syncService.pullAll();
        navigate("/");
      },
      onFailure: (err) => {
        console.error("onFailure:", err);
        setError(err.message || JSON.stringify(err));
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log("newPasswordRequired:", userAttributes, requiredAttributes);
        setError("New password required");
      },
    });
  };

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
