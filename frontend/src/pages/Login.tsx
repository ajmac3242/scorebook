import React, { useState } from "react";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { UserPool } from "../UserPool";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Alert,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { syncService } from "../utils/syncService";
import { logger } from "../utils/logger";

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
        logger.error("Authentication failed", err);
        setError(err.message || JSON.stringify(err));
      },
      newPasswordRequired: (_userAttributes, _requiredAttributes) => {
        setError("New password required");
      },
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="max-w-[400px] w-full p-4 shadow-xl">
        <CardHeader className="flex flex-col items-center pb-0 pt-6 px-4">
          <h1 className="text-2xl font-serif font-bold text-primary-900">Sign In</h1>
          <p className="text-small text-default-500">Enter your credentials to continue</p>
        </CardHeader>
        <CardBody>
          {error && (
            <Alert color="danger" variant="flat" className="mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-small font-bold">Error</span>
                <span className="text-tiny">{error}</span>
              </div>
            </Alert>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              isRequired
              label="Username"
              placeholder="Enter your username"
              type="text"
              variant="bordered"
              value={username}
              onValueChange={setUsername}
              autoComplete="username"
              autoFocus
            />
            <Input
              isRequired
              label="Password"
              placeholder="Enter your password"
              type="password"
              variant="bordered"
              value={password}
              onValueChange={setPassword}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              color="primary"
              variant="solid"
              fullWidth
              className="mt-2 font-bold"
            >
              Sign In
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default Login;
